import {
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

// A label starts a combination only when it is a colon-suffixed A-F: "A:09 19 24 27 43 33",
// "A: 07-14", "B: LP 02-11", "E: 25-26-27-28-29-30". The `(?<!\d)` style guard below keeps a
// ticket serial like 1234-5678-9012 from being read as number groups.
const LABEL_PATTERN = /(^|\n|\s)([A-F])\s*:\s*(?=(?:LP\s*)?\d)/g
const NUMBER_RUN = /(?<!\d)\d{1,2}(?!\d)/g

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function toIso(year, month, day) {
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

export function monthFromToken(token) {
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

// Ticket draw date tokens. The only accepted shapes are the on-ticket spellings of the day, a
// dash-separated day-month-year body, and an optional leading weekday: "Fri 25-Sep-26", "Fr 25-Sep-26",
// "F 25-Sep-26". A "Draw"/"Dr" header may precede the date, optionally followed by a 7-character
// alphanumeric draw number and a weekday: "Draw 09-Sep-26", "Draw J000456 NeD 09-Sep-26",
// "Draw 0000456 WED 09-Sep-26", "Dr 0000456 W 09-Sep-26".
const DRAW_PREFIX = String.raw`(?:DRAW|DR)(?:\s*(?:NO\.?|#|:))?\s*(?:[A-Z0-9]{7}\s+)?(?:[A-Z]{1,3}[.,]?\s+)?`
const MONTH_DATE_PATTERN = new RegExp(`(?:${DRAW_PREFIX})?(?:^|[^A-Z0-9])(\\d{1,2})-([A-Z]{1,3})-(\\d{2})(?![0-9])`)
const DRAW_MONTH_DATE_PATTERN = new RegExp(`(?:^|[^A-Z0-9])${DRAW_PREFIX}(\\d{1,2})-([A-Z]{1,3})-(\\d{2})(?![0-9])`)

export function findDrawDate(rawText) {
  const text = String(rawText ?? '').toUpperCase()

  // Prefer a date anchored to a "Draw"/"Dr" header so a stray serial cannot win.
  let match = text.match(DRAW_MONTH_DATE_PATTERN)
  if (!match) match = text.match(MONTH_DATE_PATTERN)
  if (!match) return null

  const month = monthFromToken(match[2])
  if (!month) return null

  return toIso(match[3], month, match[1])
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
