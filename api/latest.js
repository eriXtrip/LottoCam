const UPSTREAM = 'https://lottoresulta.com/api/v1/latest'
const TIMEOUT_MS = 8000

export default async function handler(_req, res) {
  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const body = await upstream.text()

    res.status(upstream.status)
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader(
      'cache-control',
      upstream.ok ? 's-maxage=30, stale-while-revalidate=120' : 'no-store',
    )
    res.send(body)
  } catch (error) {
    res.status(502).json({
      error: 'Could not reach the results source.',
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}
