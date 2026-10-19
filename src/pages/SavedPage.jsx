import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameById } from '../lib/games.js'
import { formatDrawDate } from '../lib/format.js'
import { loadTickets, saveTickets } from '../lib/storage.js'

function savedOn(iso) {
  if (!iso) return null
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SavedPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState(loadTickets)

  function remove(id) {
    const next = records.filter((record) => record.id !== id)
    saveTickets(next)
    setRecords(next)
  }

  function open(record) {
    navigate('/', { state: { ticket: record.ticket } })
  }

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">My tickets</p>
        <h1 className="page-title">Tickets you saved on this device</h1>
        <p className="page-lede">
          Saved tickets live in this browser only. They are never uploaded. Open one to check it
          again or to fix a number.
        </p>
      </div>

      {records.length === 0 ? (
        <div className="status">
          <p className="status__title">No saved tickets yet</p>
          <p>Scan a ticket and save it after a check, and it will appear here.</p>
        </div>
      ) : (
        <div className="draw-list">
          {records.map((record) => {
            const game = gameById(record.ticket?.category)
            const when = savedOn(record.savedAt)
            return (
              <article className="draw" key={record.id}>
                <div className="draw__head">
                  <span className="draw__game">{game ? game.label : 'Game not set'}</span>
                  <span className="draw__when">
                    {formatDrawDate(record.ticket?.drawDate) ?? 'No draw date'}
                  </span>
                </div>

                <ul className="numbers">
                  {(record.ticket?.combinations ?? []).map((combo) => (
                    <li key={combo.label} className="numball">
                      {combo.label}: {combo.numbers.map((n) => String(n).padStart(2, '0')).join('-')}
                    </li>
                  ))}
                </ul>

                <div className="draw__meta">
                  {when ? <span>Saved {when}</span> : null}
                </div>

                <div className="btn-row">
                  <button type="button" className="btn btn--ghost" onClick={() => open(record)}>
                    Open and check
                  </button>
                  <button type="button" className="btn btn--quiet" onClick={() => remove(record.id)}>
                    Remove
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
