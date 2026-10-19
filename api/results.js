const UPSTREAM = 'https://lottoresulta.com/api/v1/results'
const TIMEOUT_MS = 8000

export default async function handler(req, res) {
  try {
    const url = new URL(UPSTREAM)
    const { date, game } = req.query ?? {}
    if (date) url.searchParams.set('date', String(date))
    if (game) url.searchParams.set('game', String(game))

    const upstream = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const body = await upstream.text()

    res.status(upstream.status)
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader(
      'cache-control',
      upstream.ok ? 's-maxage=60, stale-while-revalidate=300' : 'no-store',
    )
    res.send(body)
  } catch (error) {
    res.status(502).json({
      error: 'Could not reach the results source.',
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}
