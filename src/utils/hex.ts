export const stripHexPrefix = (s: string): string => {
  return s.startsWith("0x") ? s.slice(2) : s
}

export function formatHex(hex: string): string {
  return /^0x/i.test(hex) ? hex : `0x${hex}`
}

export const fromHex = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(Math.floor(hex.length / 2))
  let i
  for (i = 0; i < bytes.length; i++) {
    const a = MAP_HEX[hex[i * 2]]
    const b = MAP_HEX[hex[i * 2 + 1]]
    if (a === undefined || b === undefined) {
      break
    }
    bytes[i] = (a << 4) | b
  }
  return i === bytes.length ? bytes : bytes.slice(0, i)
}

const MAP_HEX: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
}
