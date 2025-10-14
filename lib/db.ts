import type { Block, Permission, RecordItem, User } from "./types"

const DB_NAME = "medchain-db"
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains("users")) {
        const store = db.createObjectStore("users", { keyPath: "id" })
        store.createIndex("byEmail", "email", { unique: true })
        store.createIndex("byRole", "role", { unique: false })
      }
      if (!db.objectStoreNames.contains("records")) {
        const store = db.createObjectStore("records", { keyPath: "id" })
        store.createIndex("byPatient", "patientId", { unique: false })
        store.createIndex("byAuthor", "authorId", { unique: false })
        store.createIndex("byPatientCreatedAt", ["patientId", "createdAt"], { unique: false })
      }
      if (!db.objectStoreNames.contains("permissions")) {
        const store = db.createObjectStore("permissions", { keyPath: "id" })
        store.createIndex("byPatient", "patientId", { unique: false })
        store.createIndex("byDoctor", "doctorId", { unique: false })
        store.createIndex("byPatientDoctor", ["patientId", "doctorId"], { unique: true })
      }
      if (!db.objectStoreNames.contains("blocks")) {
        const store = db.createObjectStore("blocks", { keyPath: "id" })
        store.createIndex("byPatientIndex", ["patientId", "index"], { unique: true })
        store.createIndex("byPatient", "patientId", { unique: false })
      }
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Helpers
async function tx<T = unknown>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => void,
): Promise<T> {
  const db = await openDB()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(storeName, mode)
    const store = t.objectStore(storeName)
    let result: any
    t.oncomplete = () => resolve(result)
    t.onerror = () => reject(t.error)
    result = fn(store)
  })
}

async function multiTx<T = unknown>(
  storeNames: string[],
  mode: IDBTransactionMode,
  fn: (getStore: (name: string) => IDBObjectStore) => void,
): Promise<T> {
  const db = await openDB()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(storeNames, mode)
    const getStore = (name: string) => t.objectStore(name)
    let result: any
    t.oncomplete = () => resolve(result)
    t.onerror = () => reject(t.error)
    result = fn(getStore)
  })
}

// Users
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readonly")
    const idx = tx.objectStore("users").index("byEmail")
    const req = idx.get(email)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readonly")
    const req = tx.objectStore("users").get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function putUser(user: User) {
  return tx("users", "readwrite", (store) => {
    store.put(user)
  })
}

export async function listUsersByRole(role: "patient" | "doctor"): Promise<User[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readonly")
    const idx = tx.objectStore("users").index("byRole")
    const req = idx.getAll(role)
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => reject(req.error)
  })
}

// Records
export async function putRecord(rec: RecordItem) {
  return tx("records", "readwrite", (store) => {
    store.put(rec)
  })
}

export async function listRecordsByPatient(patientId: string): Promise<RecordItem[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("records", "readonly")
    const idx = tx.objectStore("records").index("byPatient")
    const req = idx.getAll(patientId)
    req.onsuccess = () => {
      const arr: RecordItem[] = (req.result ?? []).sort((a, b) => a.createdAt - b.createdAt)
      resolve(arr)
    }
    req.onerror = () => reject(req.error)
  })
}

// Permissions
export async function putPermission(p: Permission) {
  return tx("permissions", "readwrite", (store) => {
    store.put(p)
  })
}

export async function deletePermission(patientId: string, doctorId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("permissions", "readwrite")
    const idx = tx.objectStore("permissions").index("byPatientDoctor")
    const req = idx.get([patientId, doctorId])
    req.onsuccess = () => {
      const rec = req.result as Permission | undefined
      if (rec) {
        tx.objectStore("permissions").delete(rec.id)
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function listPermissionsForPatient(patientId: string): Promise<Permission[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("permissions", "readonly")
    const idx = tx.objectStore("permissions").index("byPatient")
    const req = idx.getAll(patientId)
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => reject(req.error)
  })
}

export async function listPermissionsForDoctor(doctorId: string): Promise<Permission[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("permissions", "readonly")
    const idx = tx.objectStore("permissions").index("byDoctor")
    const req = idx.getAll(doctorId)
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => reject(req.error)
  })
}

// Blocks
export async function putBlock(b: Block) {
  return tx("blocks", "readwrite", (store) => {
    store.put(b)
  })
}

export async function listBlocksByPatient(patientId: string): Promise<Block[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blocks", "readonly")
    const idx = tx.objectStore("blocks").index("byPatient")
    const req = idx.getAll(patientId)
    req.onsuccess = () => {
      const arr: Block[] = (req.result ?? []).sort((a, b) => a.index - b.index)
      resolve(arr)
    }
    req.onerror = () => reject(req.error)
  })
}

// Files
export async function putFile(id: string, file: Blob) {
  return tx("files", "readwrite", (store) => {
    store.put({ id, file })
  })
}

export async function getFile(id: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly")
    const req = tx.objectStore("files").get(id)
    req.onsuccess = () => resolve(req.result?.file ?? null)
    req.onerror = () => reject(req.error)
  })
}
