import {
  COMBINATION_LABELS,
  MAX_COMBINATIONS,
  NUMBERS_PER_COMBINATION,
  matchGame,
} from './games.js'

const MONTHS = {
  // Standard 3+ letter months
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
  SEPT: 9,

  // Common 2-letter abbreviations
  JA: 1,
  FE: 2,
  MR: 3,
  AP: 4,
  MY: 5,
  JN: 6,
  JL: 7,
  AU: 8,
  AG: 8,
  SE: 9,
  SP: 9,
  OC: 10,
  NO: 11,
  NV: 11,
  DE: 12,
  DC: 12,

  // Unambiguous single-letter months
  F: 2,  // February (only month starting with F)
  S: 9,  // September (only month starting with S)
  O: 10, // October (only month starting with O)
  N: 11, // November (only month starting with N)
  D: 12, // December (only month starting with D)
}

// A label starts a combination when it sits on its own and a number group follows, with an optional
// Lucky Pick marker in between: "A:09 19 24 27 43 33", "A. 07-14", "B LP 02-11". The `(?<!\d)` style guard below keeps a
// ticket serial like 1234-5678-9012 from being read as number groups.
const LABEL_PATTERN = /(^|\n|\s)([A-D])\s*[:.);\-]?\s*(?=(?:LP\s*)?\d)/g
const NUMBER_RUN = /(?<!\d)\d{1,2}(?!\d)/g

function pad2(value) {
  return String(value).padStart(2, '0')
}

function toIso(year, month, day) {
  let y = Number(year)
  if (y >= 0 && y < 100) {
    y = 2000 + y
  }
  const m = Number(month)
  const d = Number(day)
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null
  if (m < 1 || m > 12 || d < 1 || d > 31) return null

  const probe = new Date(Date.UTC(y, m - 1, d))
  const stable =
    probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d
  return stable ? `${y}-${pad2(m)}-${pad2(d)}` : null
}

function monthFromToken(token) {
  const cleaned = String(token ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (!cleaned) return null

  if (MONTHS[cleaned]) return MONTHS[cleaned]
  if (MONTHS[cleaned.slice(0, 3)]) return MONTHS[cleaned.slice(0, 3)]

  // OCR digit-to-letter normalization: '5' -> 'S' (e.g. 5EP -> SEP), '0' -> 'O' (e.g. 0CT -> OCT)
  const deconfused = cleaned.replace(/^5/, 'S').replace(/^0/, 'O')
  if (MONTHS[deconfused]) return MONTHS[deconfused]
  if (MONTHS[deconfused.slice(0, 3)]) return MONTHS[deconfused.slice(0, 3)]

  return null
}

function extractNumbers(text) {
  const found = text.match(NUMBER_RUN)
  return found ? found.map(Number) : []
}

export function findDrawDate(rawText) {
  const text = String(rawText ?? '').toUpperCase()

  // 1. Primary PCSO Draw header pattern: "Draw 0000457 TUE 08-Sep-28", "DW 0000456 WED 09-Sep-26"
  let match = text.match(
    /\b(?:DRAW|DW)(?:\s*(?:NO\.?|#|:))?\s*(\d{3,8})\s+(?:(?:MON|TUE|WED|THU|FRI|SAT|SUN|[A-Z]{3,4})[.,]?\s+)?(\d{1,2})[\s\-\/.]([A-Z0-9]{1,9})\.?[\s\-\/.](20\d{2}|\d{2})\b/,
  )
  if (match) {
    const month = monthFromToken(match[3])
    if (month) {
      const iso = toIso(match[4], month, match[2])
      if (iso) return iso
    }
  }

  // 2. Draw line without draw number: "Draw TUE 08-Sep-28", "DW WED 09-Sep-26"
  match = text.match(
    /\b(?:DRAW|DW)(?:\s*(?:NO\.?|#|:))?\s+(?:(?:MON|TUE|WED|THU|FRI|SAT|SUN|[A-Z]{3,4})[.,]?\s+)?(\d{1,2})[\s\-\/.]([A-Z0-9]{1,9})\.?[\s\-\/.](20\d{2}|\d{2})\b/,
  )
  if (match) {
    const month = monthFromToken(match[2])
    if (month) {
      const iso = toIso(match[3], month, match[1])
      if (iso) return iso
    }
  }

  // 3. ISO format: 2026-10-18
  match = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
  if (match) {
    const iso = toIso(match[1], match[2], match[3])
    if (iso) return iso
  }

  // 3. Numeric slash/dot: 10/18/2026 or 10/18/26
  match = text.match(/\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2}|\d{2})\b/)
  if (match) {
    const iso = toIso(match[3], match[1], match[2])
    if (iso) return iso
  }

  // 4. Day-Month-Year (e.g. 08-S-26, 09-Sep-26, 18 Oct 2026, 09-SEP-2026)
  match = text.match(/\b(\d{1,2})[\s\-\/.]([A-Z0-9]{1,9})\.?[\s\-\/.](20\d{2}|\d{2})\b/)
  if (match) {
    const month = monthFromToken(match[2])
    if (month) {
      const iso = toIso(match[3], month, match[1])
      if (iso) return iso
    }
  }

  // 5. Month-Day-Year (e.g. OCT 18, 2026 or OCT 18 2026)
  match = text.match(/\b([A-Z]{3,9})\.?[\s\-\/.](\d{1,2}),?[\s\-\/.](20\d{2}|\d{2})\b/)
  if (match) {
    const month = monthFromToken(match[1])
    if (month) {
      const iso = toIso(match[3], month, match[2])
      if (iso) return iso
    }
  }

  return null
}

function splitLabeled(text) {
  const segments = []
  let match
  LABEL_PATTERN.lastIndex = 0
  while ((match = LABEL_PATTERN.exec(text)) !== null) {
    segments.push({ label: match[2], bodyStart: LABEL_PATTERN.lastIndex, labelIndex: match.index })
  }
  LABEL_PATTERN.lastIndex = 0

  return segments.map((segment, index) => {
    const end = index + 1 < segments.length ? segments[index + 1].labelIndex : text.length
    return { label: segment.label, body: text.slice(segment.bodyStart, end) }
  })
}

function extractCombinations(text) {
  const combos = []
  const seen = new Set()

  for (const segment of splitLabeled(text)) {
    if (seen.has(segment.label)) continue
    const numbers = extractNumbers(segment.body).slice(0, NUMBERS_PER_COMBINATION)
    if (numbers.length === 0) continue
    seen.add(segment.label)
    combos.push({ label: segment.label, numbers })
    if (combos.length === MAX_COMBINATIONS) break
  }
  if (combos.length > 0) return combos

  // No labels survived OCR. Accept any line that reads as exactly six numbers.
  for (const line of text.split(/\r?\n/)) {
    const numbers = extractNumbers(line)
    if (numbers.length !== NUMBERS_PER_COMBINATION) continue
    combos.push({ label: COMBINATION_LABELS[combos.length], numbers })
    if (combos.length === MAX_COMBINATIONS) break
  }
  return combos
}

export function parseTicket(rawText) {
  const text = String(rawText ?? '').toUpperCase()
  const notes = []

  const game = matchGame(text)
  if (!game) notes.push('Could not read the game. Pick it from the list.')

  const drawDate = findDrawDate(text)
  if (!drawDate) notes.push('Could not read the draw date. Enter it.')

  const combinations = extractCombinations(text)
  if (combinations.length === 0) {
    notes.push('Could not read any combinations. Enter them by hand.')
  }

  return {
    category: game ? game.id : null,
    drawDate,
    combinations,
    notes,
  }
}

export const __test__ = { extractNumbers, splitLabeled, toIso }
