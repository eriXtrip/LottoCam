const UPSTREAM = 'https://lottoresulta.com/api/v1'

export class ResultsError extends Error {
  constructor(message, { status = 0 } = {}) {
    super(message)
    this.name = 'ResultsError'
    this.status = status
  }
}

// Vite's dev server has no functions and LottoResulta sets open CORS, so in development we call it
// directly. In production everything goes through our own /api routes, which proxy upstream.
function buildUrl(proxyPath, upstreamPath, params = {}) {
  const url = import.meta.env.DEV
    ? new URL(`${UPSTREAM}/${upstreamPath}`)
    : new URL(proxyPath, window.location.origin)

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }
  return url
}

async function getJson(url) {
  let response
  try {
    response = await fetch(url, { headers: { accept: 'application/json' } })
  } catch {
    throw new ResultsError('Could not reach the results service. Check your connection.')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ResultsError(payload?.error ?? `The results service returned ${response.status}.`, {
      status: response.status,
    })
  }
  return payload
}

export function fetchLatestDraws() {
  return getJson(buildUrl('/api/latest', 'latest'))
}

export function fetchDrawsByDate({ date, game } = {}) {
  return getJson(buildUrl('/api/results', 'results', { date, game }))
}

export function checkTicket({ game, numbers, date }) {
  return getJson(buildUrl('/api/check', 'check', { game, numbers, date }))
}
