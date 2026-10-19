const UPSTREAM = 'https://lottoresulta.com/api/v1/check'
const TIMEOUT_MS = 8000

// Upstream rejects anything else, so validate here to keep invalid traffic off their server.
// Game ids look like 6-42-lotto and 6-58-lotto (a single leading digit).
const GAME_PATTERN = /^\d{1,2}-\d{2}-lotto$/
const NUMBERS_PATTERN = /^\d{1,2}(-\d{1,2}){5}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export default async function handler(req, res) {
  const { game, numbers, date } = req.query

  if (typeof game !== 'string' || !GAME_PATTERN.test(game)) {
    res.status(400).json({ error: 'A valid game id is required.' })
    return
  }
  if (typeof numbers !== 'string' || !NUMBERS_PATTERN.test(numbers)) {
    res.status(400).json({ error: 'numbers must be six values separated by dashes.' })
    return
  }
  if (date !== undefined && (typeof date !== 'string' || !DATE_PATTERN.test(date))) {
    res.status(400).json({ error: 'date must be YYYY-MM-DD.' })
    return
  }

  const url = new URL(UPSTREAM)
  url.searchParams.set('game', game)
  url.searchParams.set('numbers', numbers)
  if (date) url.searchParams.set('date', date)

  try {
    const upstream = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const body = await upstream.text()

    res.status(upstream.status)
    res.setHeader('content-type', 'application/json; charset=utf-8')
    // A draw result can still be corrected, so never cache a check.
    res.setHeader('cache-control', 'no-store')
    res.send(body)
  } catch (error) {
    res.status(502).json({
      error: 'Could not reach the results source.',
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}
