export const MAX_COMBINATIONS = 4
export const NUMBERS_PER_COMBINATION = 6
export const COMBINATION_LABELS = ['A', 'B', 'C', 'D']

// Major Jackpot (pari-mutuel) games only, per the product scope. `drawDays` is 0=Sun..6=Sat.
export const JACKPOT_GAMES = [
  {
    id: '6-42-lotto',
    label: 'Lotto 6/42',
    fraction: '6 42',
    keywords: [],
    pick: 6,
    max: 42,
    drawDays: [2, 4, 6],
  },
  {
    id: '6-45-lotto',
    label: 'Mega Lotto 6/45',
    fraction: '6 45',
    keywords: ['MEGALOTTO', 'MEGA LOTTO', 'MEGA'],
    pick: 6,
    max: 45,
    drawDays: [1, 3, 5],
  },
  {
    id: '6-49-lotto',
    label: 'Super Lotto 6/49',
    fraction: '6 49',
    keywords: ['SUPERLOTTO', 'SUPER LOTTO', 'SUPER'],
    pick: 6,
    max: 49,
    drawDays: [0, 2, 4],
  },
  {
    id: '6-55-lotto',
    label: 'Grand Lotto 6/55',
    fraction: '6 55',
    keywords: ['GRAND LOTTO', 'GRAND'],
    pick: 6,
    max: 55,
    drawDays: [1, 3, 6],
  },
  {
    id: '6-58-lotto',
    label: 'Ultra Lotto 6/58',
    fraction: '6 58',
    keywords: ['ULTRA LOTTO', 'ULTRA'],
    pick: 6,
    max: 58,
    drawDays: [0, 2, 5],
  },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function gameById(id) {
  return JACKPOT_GAMES.find((game) => game.id === id) ?? null
}

// Fold everything to single spaces between alphanumerics so `6/55`, `6-55`, and `6 55` all match.
function normalize(text) {
  return String(text ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const FRACTION_REGEX = /(?<!\d)6(?:\s*[/\\|\-:.]\s*|\s+)(42|45|49|55|58)(?!\d)/i

export function matchGame(rawText) {
  if (!rawText) return null

  // 1. Primary: Explicit 6/42, 6/45, 6/49, 6/55, 6/58 fraction detection.
  // Check the ticket header (before combinations) first, then fallback to full text.
  const headerEnd = rawText.search(/(?:^|[\r\n\s])[A-D]\s*[:.);\-]?\s*(?=(?:LP\s*)?\d)/i)
  const header = headerEnd !== -1 ? rawText.slice(0, headerEnd) : rawText

  const headerMatch = header.match(FRACTION_REGEX)
  if (headerMatch) {
    const game = gameById(`6-${headerMatch[1]}-lotto`)
    if (game) return game
  }

  const fullMatch = rawText.match(FRACTION_REGEX)
  if (fullMatch) {
    const game = gameById(`6-${fullMatch[1]}-lotto`)
    if (game) return game
  }

  // 2. Fallback: Keyword-based scoring for text where fraction was degraded.
  const text = normalize(rawText)
  if (!text) return null

  let best = null
  for (const game of JACKPOT_GAMES) {
    let score = 0
    if (text.includes(game.fraction)) score += 3
    for (const keyword of game.keywords) {
      if (text.includes(keyword)) score += 2
    }
    if (score > 0 && (best === null || score > best.score)) best = { game, score }
  }
  return best?.game ?? null
}

export function drawDaysLabel(game) {
  return [...game.drawDays]
    .sort((a, b) => a - b)
    .map((day) => DAY_NAMES[day])
    .join(', ')
}

export function checkCombination(numbers, game) {
  const issues = []
  const filled = numbers.filter((value) => Number.isInteger(value))

  if (filled.length !== game.pick) issues.push(`Needs ${game.pick} numbers.`)

  if (filled.some((value) => value < 1 || value > game.max)) {
    issues.push(`Numbers run from 1 to ${game.max}.`)
  }

  const seen = new Set()
  const repeated = filled.filter((value) => (seen.has(value) ? true : (seen.add(value), false)))
  if (repeated.length > 0) issues.push('A combination cannot repeat a number.')

  return issues
}
