// Validation utilities
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(input: string): Uint8Array {
  const upper = input.toUpperCase().replace(/=+$/, '')
  const length = upper.length
  const count = Math.floor((length * 5) / 8)
  const result = new Uint8Array(count)

  let buffer = 0
  let bitsLeft = 0
  let next = 0

  for (let i = 0; i < length; i++) {
    const val = ALPHABET.indexOf(upper[i])
    if (val === -1) throw new Error('Invalid base32 character')
    buffer = (buffer << 5) | val
    bitsLeft += 5
    if (bitsLeft >= 8) {
      result[next++] = (buffer >> (bitsLeft - 8)) & 0xff
      bitsLeft -= 8
    }
  }
  return result
}

function crc16(data: Uint8Array): number {
  let crc = 0x0000
  for (let i = 0; i < data.length; i++) {
    const byte = data[i]
    let code = (crc >>> 8) & 0xff
    code ^= byte
    code ^= code >>> 4
    crc = (crc << 8) ^ (code << 12) ^ (code << 5) ^ code
    crc &= 0xffff
  }
  return crc
}

export const isValidStellarAddress = (address: string): boolean => {
  try {
    if (address.length !== 56) return false
    if (address[0] !== 'G') return false
    const decoded = base32Decode(address)
    if (decoded.length !== 35) return false
    const versionByte = decoded[0]
    if (versionByte !== 0x30) return false // 6 << 3 = 48 (0x30) for Ed25519 Public Key

    const payload = decoded.slice(1, 33)
    const checksum = decoded.slice(33, 35)
    const calculatedCrc = crc16(new Uint8Array([versionByte, ...payload]))
    const expectedCrc = checksum[0] | (checksum[1] << 8)
    return calculatedCrc === expectedCrc
  } catch {
    return false
  }
}

export const isValidContractAddress = (address: string): boolean => {
  try {
    if (address.length !== 56) return false
    if (address[0] !== 'C') return false
    const decoded = base32Decode(address)
    if (decoded.length !== 35) return false
    const versionByte = decoded[0]
    if (versionByte !== 0x10) return false // 2 << 3 = 16 (0x10) for Contract

    const payload = decoded.slice(1, 33)
    const checksum = decoded.slice(33, 35)
    const calculatedCrc = crc16(new Uint8Array([versionByte, ...payload]))
    const expectedCrc = checksum[0] | (checksum[1] << 8)
    return calculatedCrc === expectedCrc
  } catch {
    return false
  }
}

export const validateTokenParams = (params: {
  name?: string
  symbol?: string
  decimals?: number
  initialSupply?: string
}) => {
  const errors: Record<string, string> = {}

  const trimmedName = params.name?.trim() || ''
  const trimmedSymbol = params.symbol?.trim() || ''

  if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 32) {
    errors.name = 'Token name must be 1-32 characters'
  } else if (!/^[A-Za-z0-9 _-]+$/.test(trimmedName)) {
    errors.name = 'Token name can only contain letters, digits, spaces, hyphens, and underscores'
  }

  if (!trimmedSymbol || trimmedSymbol.length < 1 || trimmedSymbol.length > 12) {
    errors.symbol = 'Token symbol must be 1-12 characters'
  } else if (!/^[A-Za-z0-9-]+$/.test(trimmedSymbol)) {
    errors.symbol = 'Token symbol can only contain alphanumeric characters and hyphens'
  }

  if (
    params.decimals === undefined ||
    params.decimals === null ||
    params.decimals < 0 ||
    params.decimals > 18
  ) {
    errors.decimals = 'Decimals must be 0-18'
  }

  if (!params.initialSupply || parseFloat(params.initialSupply) <= 0) {
    errors.initialSupply = 'Initial supply must be greater than 0'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// CIDv0: Qm + 44 base58 chars (total 46); CIDv1: bafy... base32
const CID_V0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
const CID_V1 = /^b[a-z2-7]{58,}$/

export const isValidIPFSUri = (uri: string): boolean => {
  if (!uri.startsWith('ipfs://')) return false
  const cid = uri.slice(7)
  return CID_V0.test(cid) || CID_V1.test(cid)
}

export const isValidImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and GIF images are allowed' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB' }
  }

  return { valid: true }
}

export const validateTokenName = (name: string): boolean => {
  const trimmed = name.trim()
  // Allow letters, digits, spaces, hyphens, underscores — reject HTML/special chars
  const validPattern = /^[A-Za-z0-9 _-]+$/
  return trimmed.length >= 1 && trimmed.length <= 32 && validPattern.test(trimmed)
}

export const validateTokenSymbol = (symbol: string): boolean => {
  const trimmed = symbol.trim()
  // Only allow alphanumeric characters and hyphens
  const validPattern = /^[A-Za-z0-9-]+$/
  return trimmed.length >= 1 && trimmed.length <= 12 && validPattern.test(trimmed)
}

export const sanitizeTokenInput = (input: string): string => {
  return input.trim()
}

export const validateDecimals = (decimals: number): boolean => {
  return decimals >= 0 && decimals <= 18
}
