export type Role = "patient" | "doctor"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  saltHex?: string
  passwordHashHex?: string
  walletAddress?: string
  createdAt: number
  authMethod: 'password' | 'metamask'
  // Basic Info
  age?: string
  gender?: string
  height?: string
  weight?: string
  // Vital Signs
  bloodPressure?: string
  heartRate?: string
  temperature?: string
  respiratoryRate?: string
  // Body Composition
  bmi?: string
  bodyFat?: string
  muscleMass?: string
  boneDensity?: string
}

export type RecordType = "report" | "update"

export interface RecordItem {
  id: string
  patientId: string
  authorId: string
  authorName: string
  type: RecordType
  title?: string
  fileId?: string
  createdAt: number
}

export interface Permission {
  id: string
  patientId: string
  doctorId: string
  grantedAt: number
}

export interface Block {
  id: string
  patientId: string
  index: number
  prevHash: string
  hash: string
  timestamp: number
  payloadType: "report" | "update" | "access-granted" | "access-revoked" | "genesis"
  payloadRef?: string // recordId or permission id
  authorId: string
  authorName: string
}
