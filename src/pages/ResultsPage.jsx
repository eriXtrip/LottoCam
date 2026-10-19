import { useCallback, useEffect, useState } from 'react'
import { JACKPOT_GAMES } from '../lib/games.js'
import { fetchLatestDraws, fetchDrawsByDate } from '../lib/resultsApi.js'
import { formatDrawDate, formatPeso, sessionLabel, statusLabel } from '../lib/format.js'

const JACKPOT_IDS = new Set(JACKPOT_GAMES.map((game) => game.id))
const PAGE_SIZE = 6

function filterAndSortJackpotDraws(draws) {
  return (draws ?? [])
    .filter((draw) => JACKPOT_IDS.has(draw.game))
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      if (a.session !== b.session) return (b.session ?? '').localeCompare(a.session ?? '')
      return (a.name ?? '').localeCompare(b.name ?? '')
    })
}

function previousDateString(isoDate) {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function DrawRow({ draw }) {
  const jackpot = formatPeso(draw.jackpot)
  return (
    <article className="draw">
      <div className="draw__head">
        <span className="draw__game">{draw.name}</span>
        <span className="draw__when">
          {formatDrawDate(draw.date)} · {sessionLabel(draw.session)}
        </span>
      </div>

      <ul className="numbers">
        {(draw.numbers ?? []).map((value, index) => (
          <li key={index} className="numball">
            {String(value).padStart(2, '0')}
          </li>
        ))}
      </ul>

      <div className="draw__meta">
        <span className="badge-soft">{statusLabel(draw.status)}</span>
        <span>
          Jackpot <strong>{jackpot ?? 'Not published'}</strong>
        </span>
        <span>
          Winners <strong>{draw.winners ?? 0}</strong>
        </span>
      </div>
    </article>
  )
}

export default function ResultsPage() {
  const [state, setState] = useState({
    status: 'loading',
    allDraws: [],
    message: '',
  })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasReachedEnd, setHasReachedEnd] = useState(false)

  const load = useCallback(async () => {
    setState({ status: 'loading', allDraws: [], message: '' })
    setVisibleCount(PAGE_SIZE)
    setHasReachedEnd(false)
    try {
      const payload = await fetchLatestDraws()
      const draws = filterAndSortJackpotDraws(payload.draws)
      setState({ status: 'ready', allDraws: draws, message: '' })
    } catch (error) {
      setState({
        status: 'error',
        allDraws: [],
        message: error instanceof Error ? error.message : 'The draws could not be loaded.',
      })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleLoadMore = async () => {
    if (visibleCount < state.allDraws.length) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, state.allDraws.length))
      return
    }

    // When we've displayed all currently held draws, fetch older days from the API
    setIsLoadingMore(true)
    try {
      const oldestDate = state.allDraws[state.allDraws.length - 1]?.date
      if (!oldestDate) {
        setHasReachedEnd(true)
        return
      }

      let targetDate = oldestDate
      let added = []
      // Look back up to 3 days to find the next draw date
      for (let i = 0; i < 3; i++) {
        targetDate = previousDateString(targetDate)
        const res = await fetchDrawsByDate({ date: targetDate })
        const found = filterAndSortJackpotDraws(res?.draws)
        if (found.length > 0) {
          added = found
          break
        }
      }

      if (added.length > 0) {
        const existingKeys = new Set(
          state.allDraws.map((d) => `${d.game}-${d.date}-${d.session}`),
        )
        const uniqueAdded = added.filter(
          (d) => !existingKeys.has(`${d.game}-${d.date}-${d.session}`),
        )
        if (uniqueAdded.length > 0) {
          setState((prev) => ({
            ...prev,
            allDraws: [...prev.allDraws, ...uniqueAdded],
          }))
          setVisibleCount((prev) => prev + uniqueAdded.length)
        } else {
          setHasReachedEnd(true)
        }
      } else {
        setHasReachedEnd(true)
      }
    } catch {
      setHasReachedEnd(true)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const visibleDraws = state.allDraws.slice(0, visibleCount)
  const hasMore = visibleCount < state.allDraws.length || !hasReachedEnd

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Live feed</p>
        <h1 className="page-title">PCSO jackpot draw results</h1>
        <p className="page-lede">
          The latest and historical winning combinations for Major Jackpot games, newest first.
          All numbers are verified against official reports.
        </p>
      </div>

      <div className="section">
        <div className="section__head">
          <h2 className="section__title">Drawn numbers</h2>
          <p className="lede">
            Reference only. Confirm the winning combination at pcso.gov.ph before claiming a prize.
          </p>
        </div>

        {state.status === 'loading' ? (
          <div className="draw-list" role="status" aria-live="polite">
            {[1, 2, 3, 4, 5, 6].map((key) => (
              <article key={key} className="draw draw-skeleton">
                <div className="draw__head">
                  <div className="skeleton-bar skeleton-bar--game" />
                  <div className="skeleton-bar skeleton-bar--date" />
                </div>
                <div className="numbers">
                  <div className="skeleton-ball" />
                  <div className="skeleton-ball" />
                  <div className="skeleton-ball" />
                  <div className="skeleton-ball" />
                  <div className="skeleton-ball" />
                  <div className="skeleton-ball" />
                </div>
                <div className="draw__meta">
                  <div className="skeleton-bar skeleton-bar--badge" />
                  <div className="skeleton-bar skeleton-bar--meta" />
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {state.status === 'error' ? (
          <div className="status status--error" role="alert">
            <p className="status__title">The draws could not be loaded</p>
            <p>{state.message}</p>
            <div className="btn-row">
              <button type="button" className="btn btn--ghost" onClick={load}>
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {state.status === 'ready' && state.allDraws.length === 0 ? (
          <div className="status">
            <p className="status__title">No draws are published right now</p>
            <p>The feed returned no jackpot results. Check back after the next 9:00 PM draw.</p>
          </div>
        ) : null}

        {state.status === 'ready' && state.allDraws.length > 0 ? (
          <>
            <div className="draw-list">
              {visibleDraws.map((draw) => (
                <DrawRow key={`${draw.game}-${draw.date}-${draw.session}`} draw={draw} />
              ))}
            </div>

            <div className="draw-actions">
              <div className="btn-row">
                {hasMore ? (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'Loading older draws...' : 'Load more draws'}
                  </button>
                ) : (
                  <span className="draw-actions__info">All recent jackpot draws loaded</span>
                )}
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={load}
                  disabled={isLoadingMore}
                >
                  Refresh
                </button>
              </div>
              <span className="draw-actions__info">
                Showing {visibleDraws.length} of {state.allDraws.length} loaded draws
              </span>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
