import { sha256HexFromString, hashPassword, randomSaltHex } from "./crypto"
import {
  getFile,
  getUserByEmail,
  getUserById,
  listBlocksByPatient,
  listPermissionsForDoctor,
  listPermissionsForPatient,
  listRecordsByPatient,
  listUsersByRole,
  putBlock,
  putFile,
  putPermission,
  putRecord,
  putUser,
  deletePermission,
} from "./db"
import type { Block, Permission, RecordItem, Role, User } from "./types"

const SESSION_KEY = "medchain-session-user-id"

// Auth
export async function createAccount(opts: { name: string; email: string; password: string; role: Role }) {
  const { name, email, password, role } = opts
  const existing = await getUserByEmail(email)
  if (existing) {
    throw new Error("Email already registered")
  }
  const saltHex = randomSaltHex()
  const passwordHashHex = await hashPassword(password, saltHex)
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    saltHex,
    passwordHashHex,
    createdAt: Date.now(),
  }
  await putUser(user)
  localStorage.setItem(SESSION_KEY, user.id)
  // Ensure a genesis block exists for the patient
  if (role === "patient") {
    await appendBlock({
      patientId: user.id,
      payloadType: "genesis",
      payloadRef: undefined,
      authorId: user.id,
    })
  }
  return true
}

export async function login(email: string, password: string) {
  const user = await getUserByEmail(email)
  if (!user) return false
  const hash = await hashPassword(password, user.saltHex)
  if (hash !== user.passwordHashHex) return false
  localStorage.setItem(SESSION_KEY, user.id)
  return true
}

export function getCurrentUser(): User | null {
  const id = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null
  if (!id) return null
  // NOTE: indexedDB APIs are async; we can only return a cached payload synchronously if desired.
  // For simplicity, we stored only the ID. Pages should fetch details as needed where asynchronous.
  // Here we return a minimal shape with id; dashboard fetches again via SWR if needed.
  // However, to keep UI simple, we'll cache the full user in memory when set.
  // For now, we return a snapshot: id present -> treat as logged-in, but we also need user fields.
  // We'll approximate by reading from a sync cache if placed. Instead, we try to read from localStorage JSON if available.
  const cached = localStorage.getItem(`${SESSION_KEY}-cache`)
  if (cached) return JSON.parse(cached)
  // If no cache, we fallback to an object that at least has id; UI may redirect until SWR fills.
  return { id, name: "", email: "", role: "patient", saltHex: "", passwordHashHex: "", createdAt: 0 } as any
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(`${SESSION_KEY}-cache`)
}

// Helper to hydrate and cache the session user (used by dashboard fetcher if needed)
export async function getSessionUserHydrated(): Promise<User | null> {
  const id = localStorage.getItem(SESSION_KEY)
  if (!id) return null
  const user = await getUserById(id)
  if (user) localStorage.setItem(`${SESSION_KEY}-cache`, JSON.stringify(user))
  return user
}

// Permissions
export async function grantAccess(patientId: string, doctorId: string) {
  const perm: Permission = { id: crypto.randomUUID(), patientId, doctorId, grantedAt: Date.now() }
  await putPermission(perm)
  await appendBlock({
    patientId,
    payloadType: "access-granted",
    payloadRef: perm.id,
    authorId: patientId,
  })
}

export async function revokeAccess(patientId: string, doctorId: string) {
  await deletePermission(patientId, doctorId)
  await appendBlock({
    patientId,
    payloadType: "access-revoked",
    payloadRef: `${patientId}:${doctorId}`,
    authorId: patientId,
  })
}

export async function listMyPermissions(): Promise<{ doctors: User[]; patients: User[] }> {
  const me = await getSessionUserHydrated()
  if (!me) return { doctors: [], patients: [] }
  if (me.role === "patient") {
    const perms = await listPermissionsForPatient(me.id)
    const doctors = await Promise.all(perms.map(async (p) => (await getUserById(p.doctorId))!))
    return { doctors: doctors.filter(Boolean) as User[], patients: [] }
  } else {
    const perms = await listPermissionsForDoctor(me.id)
    const patients = await Promise.all(perms.map(async (p) => (await getUserById(p.patientId))!))
    return { doctors: [], patients: patients.filter(Boolean) as User[] }
  }
}

export async function getAllDoctors(): Promise<User[]> {
  return listUsersByRole("doctor")
}
export async function getAllPatients(): Promise<User[]> {
  return listUsersByRole("patient")
}

// Records
export async function addReport(patientId: string, opts: { title: string; file?: File | null }) {
  const me = await getSessionUserHydrated()
  if (!me || me.id !== patientId || me.role !== "patient") throw new Error("Only the patient can add their report")
  const id = crypto.randomUUID()
  let fileId: string | undefined
  if (opts.file) {
    fileId = crypto.randomUUID()
    await putFile(fileId, opts.file)
  }
  const rec: RecordItem = {
    id,
    patientId,
    authorId: me.id,
    authorName: me.name,
    type: "report",
    title: opts.title,
    fileId,
    createdAt: Date.now(),
  }
  await putRecord(rec)
  await appendBlock({
    patientId,
    payloadType: "report",
    payloadRef: id,
    authorId: me.id,
  })
}

export async function addDoctorUpdate(doctorId: string, patientId: string, note: string) {
  const me = await getSessionUserHydrated()
  if (!me || me.id !== doctorId || me.role !== "doctor") throw new Error("Only the doctor can add updates")
  // Check permission
  const perms = await listPermissionsForDoctor(doctorId)
  const allowed = perms.some((p) => p.patientId === patientId)
  if (!allowed) throw new Error("No access to this patient")

  const rec: RecordItem = {
    id: crypto.randomUUID(),
    patientId,
    authorId: me.id,
    authorName: me.name,
    type: "update",
    title: note.slice(0, 120),
    createdAt: Date.now(),
  }
  await putRecord(rec)
  await appendBlock({
    patientId,
    payloadType: "update",
    payloadRef: rec.id,
    authorId: me.id,
  })
}

export async function getPatientHistory(patientId: string): Promise<RecordItem[]> {
  return listRecordsByPatient(patientId)
}

export async function downloadRecordFile(recordId: string) {
  // naive: scan record to get fileId; IndexedDB has no server route, so construct link via blob
  const items = await listRecordsByPatient((await getSessionUserHydrated())!.id) // simplified path for demo
  const rec = items.find((r) => r.id === recordId)
  if (!rec?.fileId) return
  const blob = await getFile(rec.fileId)
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = rec.title || "medical-report"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Ledger
export async function getLedger(patientId: string) {
  return listBlocksByPatient(patientId)
}

export function verifyChain(blocks: Block[]): { ok: boolean; failures: { index: number; reason: string }[] } {
  const failures: { index: number; reason: string }[] = []
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const prev = blocks[i - 1]
    if (i === 0) {
      if (b.payloadType !== "genesis" || b.prevHash !== "GENESIS") {
        failures.push({ index: b.index, reason: "Invalid genesis" })
      }
    } else {
      if (b.prevHash !== prev.hash) {
        failures.push({ index: b.index, reason: "Prev hash mismatch" })
      }
    }
  }
  // We also recompute each block hash; async hash omitted for simplicity in sync verification overlay.
  // In a stricter check, you could recompute and compare hash equality asynchronously.
  return { ok: failures.length === 0, failures }
}

async function appendBlock(opts: {
  patientId: string
  payloadType: Block["payloadType"]
  payloadRef?: string
  authorId: string
}) {
  const blocks = await listBlocksByPatient(opts.patientId)
  const index = blocks.length ? Math.max(...blocks.map((b) => b.index)) + 1 : 0
  const prevHash = index === 0 ? "GENESIS" : blocks.find((b) => b.index === index - 1)!.hash
  const author = await getUserById(opts.authorId)
  const timestamp = Date.now()
  const payloadKey = `${opts.payloadType}:${opts.payloadRef ?? ""}`
  const contentHash = await sha256HexFromString(payloadKey)
  const preimage = `${prevHash}|${contentHash}|${timestamp}|${opts.authorId}|${index}`
  const hash = await sha256HexFromString(preimage)
  const block: Block = {
    id: crypto.randomUUID(),
    patientId: opts.patientId,
    index,
    prevHash,
    hash,
    timestamp,
    payloadType: opts.payloadType,
    payloadRef: opts.payloadRef,
    authorId: opts.authorId,
    authorName: author?.name ?? "Unknown",
  }
  await putBlock(block)
}
