function bufToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function sha256HexFromString(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", enc)
  return bufToHex(digest)
}

export async function sha256HexFromBytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return bufToHex(digest)
}

export function randomSaltHex(length = 16): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  return sha256HexFromString(`${saltHex}:${password}`)
}
