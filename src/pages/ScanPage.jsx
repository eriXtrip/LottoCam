import { useEffect, useMemo, useRef, useState } from 'react'
import CapturePanel from '../components/CapturePanel.jsx'
import ResultPanel from '../components/ResultPanel.jsx'
import TicketForm from '../components/TicketForm.jsx'
import {
  COMBINATION_LABELS,
  MAX_COMBINATIONS,
  NUMBERS_PER_COMBINATION,
  checkCombination,
  gameById,
} from '../lib/games.js'
import { ACTIVE_OCR, readText } from '../lib/ocr.js'
import { parseTicket } from '../lib/parseTicket.js'
import { ResultsError, checkTicket } from '../lib/resultsApi.js'

function emptyNumbers() {
  return Array.from({ length: NUMBERS_PER_COMBINATION }, () => '')
}

function padNumbers(values) {
  return Array.from({ length: NUMBERS_PER_COMBINATION }, (_, index) =>
    values[index] === undefined ? '' : String(values[index]),
  )
}

function blankTicket() {
  return {
    category: null,
    drawDate: null,
    combinations: [{ label: 'A', numbers: emptyNumbers() }],
    notes: [],
  }
}

function toFormTicket(parsed) {
  const combinations = parsed.combinations.slice(0, MAX_COMBINATIONS).map((combo, index) => ({
    label: COMBINATION_LABELS[index],
    numbers: padNumbers(combo.numbers),
  }))
  if (combinations.length === 0) {
    combinations.push({ label: 'A', numbers: emptyNumbers() })
  }
  return {
    category: parsed.category ?? null,
    drawDate: parsed.drawDate ?? null,
    combinations,
    notes: parsed.notes ?? [],
  }
}

function progressLabel(message) {
  if (!message) return 'Reading the ticket'
  if (message.status === 'recognizing text') {
    return `Reading the ticket (${Math.round((message.progress ?? 0) * 100)}%)`
  }
  if (message.status === 'loading language traineddata') return 'Loading the text model'
  if (message.status === 'initializing api') return 'Preparing the reader'
  return 'Preparing the image'
}

function TicketSkeleton({ label }) {
  return (
    <div className="ticket-skeleton" role="status" aria-live="polite">
      <div className="ticket-skeleton__header">
        <div className="skeleton-bar skeleton-bar--title" />
        <div className="skeleton-bar skeleton-bar--subtitle" />
      </div>
      <div className="ticket-skeleton__combos">
        <div className="ticket-skeleton__row">
          <div className="skeleton-ball skeleton-ball--chip" />
          <div className="ticket-skeleton__balls">
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
          </div>
        </div>
        <div className="ticket-skeleton__row">
          <div className="skeleton-ball skeleton-ball--chip" />
          <div className="ticket-skeleton__balls">
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
          </div>
        </div>
      </div>
      <div className="ticket-skeleton__status">
        <span className="skeleton-dot" aria-hidden="true" />
        <span>{label || 'Reading ticket…'}</span>
      </div>
    </div>
  )
}

function useIsSmallScreen() {
  const [isSmall, setIsSmall] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 900px)')
    const onChange = (e) => setIsSmall(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isSmall
}

export default function ScanPage() {
  const isSmallScreen = useIsSmallScreen()
  const ticketDetailsRef = useRef(null)
  const resultPanelRef = useRef(null)

  const [photo, setPhoto] = useState(null)
  const [ocr, setOcr] = useState({ state: 'idle', label: '' })
  const [ticket, setTicket] = useState(blankTicket)
  const [fillKey, setFillKey] = useState(0)
  const [check, setCheck] = useState({ state: 'idle', results: [] })

  // Modals for small screen
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)

  // Listen for Escape key to close either modal on small screens
  useEffect(() => {
    if (!isTicketModalOpen && !isResultModalOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsTicketModalOpen(false)
        setIsResultModalOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isTicketModalOpen, isResultModalOpen])

  // Prevent background scroll while either modal is active
  useEffect(() => {
    if ((isTicketModalOpen || isResultModalOpen) && isSmallScreen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [isTicketModalOpen, isResultModalOpen, isSmallScreen])

  useEffect(() => {
    if (!photo) return undefined
    let cancelled = false

    setOcr({ state: 'reading', label: 'Preparing the image' })
    setCheck({ state: 'idle', results: [] })

    readText(photo.blob, (message) => {
      if (!cancelled) setOcr({ state: 'reading', label: progressLabel(message) })
    })
      .then((text) => {
        if (cancelled) return
        console.log(`[LottoCam OCR (${ACTIVE_OCR})] Extracted text:\n`, text)
        const parsed = parseTicket(text)
        console.log(`[LottoCam OCR (${ACTIVE_OCR})] Parsed ticket:`, parsed)
        setTicket(toFormTicket(parsed))
        setFillKey((key) => key + 1)
        setOcr({ state: 'done', label: '' })

        if (isSmallScreen) {
          setIsTicketModalOpen(true)
        } else {
          // On large screen, smoothly scroll down to Ticket details
          const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
            ? 'auto'
            : 'smooth'
          ticketDetailsRef.current?.scrollIntoView({ behavior, block: 'start' })
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.error(`[LottoCam OCR (${ACTIVE_OCR})] Error reading ticket:`, error)
        setOcr({
          state: 'error',
          label: error instanceof Error ? error.message : 'Reading the ticket failed.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [photo, isSmallScreen])

  useEffect(() => {
    if (!photo) return undefined
    return () => URL.revokeObjectURL(photo.url)
  }, [photo])

  function handleImage(source) {
    setPhoto({ url: URL.createObjectURL(source), blob: source })
  }

  function handleTicketChange(next) {
    setTicket(next)
    if (check.state !== 'idle') setCheck({ state: 'idle', results: [] })
  }

  const game = gameById(ticket.category)

  const combosValid = useMemo(() => {
    if (!game) return false
    return ticket.combinations.every(
      (combo) =>
        checkCombination(
          combo.numbers.map((value) => (value === '' ? null : Number(value))),
          game,
        ).length === 0,
    )
  }, [ticket.combinations, game])

  const canCheck = Boolean(game && ticket.drawDate && combosValid)
  const missing = !game
    ? 'Pick the game printed on the ticket.'
    : !ticket.drawDate
      ? 'Enter the draw date.'
      : !combosValid
        ? 'Fix the highlighted numbers before checking.'
        : ''

  async function runCheck() {
    if (!game || !canCheck) return

    if (isSmallScreen) {
      // On small screen: transition from ticket modal to result modal
      setIsTicketModalOpen(false)
      setIsResultModalOpen(true)
    } else {
      // On large screen: smoothly scroll to Check result section
      const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
        ? 'auto'
        : 'smooth'
      resultPanelRef.current?.scrollIntoView({ behavior, block: 'start' })
    }

    setCheck({ state: 'checking', results: [] })

    const results = await Promise.all(
      ticket.combinations.map(async (combo) => {
        const numbers = combo.numbers.map((value) => Number(value))
        const base = { label: combo.label, numbers }
        try {
          const data = await checkTicket({
            game: game.id,
            numbers: numbers.join('-'),
            date: ticket.drawDate,
          })
          return {
            ...base,
            state: 'ready',
            won: Boolean(data.won),
            matchedCount: data.matchedCount ?? 0,
            winningNumbers: data.numbers ?? [],
            tiers: data.tiers ?? [],
          }
        } catch (error) {
          if (error instanceof ResultsError && error.status === 404) {
            return { ...base, state: 'pending', message: 'No result is published for that draw yet.' }
          }
          return {
            ...base,
            state: 'error',
            message: error instanceof Error ? error.message : 'The check could not finish.',
          }
        }
      }),
    )

    setCheck({ state: 'done', results })
  }

  const hasExtractedData = Boolean(
    ticket.category ||
      ticket.drawDate ||
      ticket.combinations.some((combo) => combo.numbers.some((num) => num !== '')),
  )

  const ticketFormElement = (
    <TicketForm
      ticket={ticket}
      game={game}
      disabled={ocr.state === 'reading'}
      highlightKey={fillKey}
      onChange={handleTicketChange}
      onCheck={runCheck}
      checking={check.state === 'checking'}
      canCheck={canCheck}
      missing={missing}
    />
  )

  const resultPanelElement = (
    <ResultPanel
      status={check.state}
      results={check.results}
      game={game}
      drawDate={ticket.drawDate}
    />
  )

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Major jackpot tickets</p>
        <h1 className="page-title">Read a lotto ticket, then check the draw</h1>
        <p className="page-lede">
          Photograph a PCSO jackpot ticket or upload a photo. LottoCam reads the game, the draw date,
          and up to four combinations. You confirm them, edit anything wrong, and check them against
          the live result.
        </p>
      </div>

      {isSmallScreen ? (
        /* Small screen layout: Capture first, modals for details & results */
        <div className="stack">
          <CapturePanel
            disabled={ocr.state === 'reading'}
            onImage={handleImage}
            preview={photo?.url}
          />

          {ocr.state === 'reading' ? (
            <TicketSkeleton label={ocr.label} />
          ) : null}

          {ocr.state === 'error' ? (
            <div className="status status--error" role="alert">
              <p className="status__title">Could not read the photo</p>
              <p>{ocr.label}</p>
              <p>Try a brighter, straight-on shot, or type the numbers in below.</p>
            </div>
          ) : null}

          {hasExtractedData ? (
            <div className="mobile-ticket-card">
              <div className="mobile-ticket-card__header">
                <div>
                  <span className="eyebrow">{game ? game.name : 'Extracted ticket'}</span>
                  <p className="mobile-ticket-card__summary">
                    {ticket.drawDate ? `Draw: ${ticket.drawDate}` : 'Draw date pending'} •{' '}
                    {ticket.combinations.length} combination
                    {ticket.combinations.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setIsTicketModalOpen(true)}
                  >
                    Ticket details
                  </button>
                  {check.state !== 'idle' ? (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => setIsResultModalOpen(true)}
                    >
                      Check result
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="mobile-ticket-manual">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setIsTicketModalOpen(true)}
              >
                Enter ticket details manually
              </button>
            </div>
          )}

          {/* Ticket Details Modal on Small Screen */}
          {isTicketModalOpen ? (
            <div
              className="ticket-modal-backdrop"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsTicketModalOpen(false)
              }}
              role="presentation"
            >
              <div
                className="ticket-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ticket-modal-title"
              >
                <div className="ticket-modal__head">
                  <div>
                    <span className="ticket-modal__tag">Review & confirm</span>
                    <h2 id="ticket-modal-title" className="ticket-modal__title">
                      {game ? game.name : 'Ticket details'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="ticket-modal__close"
                    onClick={() => setIsTicketModalOpen(false)}
                    aria-label="Close ticket details"
                  >
                    ✕
                  </button>
                </div>

                <div className="ticket-modal__body">
                  {ticketFormElement}
                </div>
              </div>
            </div>
          ) : null}

          {/* Check Result Modal on Small Screen */}
          {isResultModalOpen ? (
            <div
              className="ticket-modal-backdrop"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsResultModalOpen(false)
              }}
              role="presentation"
            >
              <div
                className="ticket-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="result-modal-title"
              >
                <div className="ticket-modal__head">
                  <div>
                    <span className="ticket-modal__tag">Live draw check</span>
                    <h2 id="result-modal-title" className="ticket-modal__title">
                      Check result
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="ticket-modal__close"
                    onClick={() => setIsResultModalOpen(false)}
                    aria-label="Close check result"
                  >
                    ✕
                  </button>
                </div>

                <div className="ticket-modal__body">
                  {resultPanelElement}
                  <div className="btn-row" style={{ marginTop: 'var(--s-4)' }}>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        setIsResultModalOpen(false)
                        setIsTicketModalOpen(true)
                      }}
                    >
                      Edit ticket numbers
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => setIsResultModalOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Desktop layout: Side-by-side split with smooth scroll targets */
        <div className="split">
          <div className="stack">
            <CapturePanel
              disabled={ocr.state === 'reading'}
              onImage={handleImage}
              preview={photo?.url}
            />

            {ocr.state === 'reading' ? (
              <TicketSkeleton label={ocr.label} />
            ) : null}

            {ocr.state === 'error' ? (
              <div className="status status--error" role="alert">
                <p className="status__title">Could not read the photo</p>
                <p>{ocr.label}</p>
                <p>Try a brighter, straight-on shot, or type the numbers in below.</p>
              </div>
            ) : null}

            <div ref={ticketDetailsRef} style={{ scrollMarginTop: 'var(--s-5)' }}>
              {ticketFormElement}
            </div>
          </div>

          <div className="stack" ref={resultPanelRef} style={{ scrollMarginTop: 'var(--s-5)' }}>
            {resultPanelElement}
          </div>
        </div>
      )}
    </>
  )
}
