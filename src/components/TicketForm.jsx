import {
  COMBINATION_LABELS,
  JACKPOT_GAMES,
  MAX_COMBINATIONS,
  NUMBERS_PER_COMBINATION,
  checkCombination,
  drawDaysLabel,
} from '../lib/games.js'

function toNumbers(cells) {
  return cells.map((value) => (value === '' || value == null ? null : Number(value)))
}

function cellIsInvalid(cells, index, game) {
  const raw = cells[index]
  if (raw === '' || raw == null) return false
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1 || value > game.max) return true
  return toNumbers(cells).filter((cell) => cell === value).length > 1
}

function emptyNumbers() {
  return Array.from({ length: NUMBERS_PER_COMBINATION }, () => '')
}

export default function TicketForm({
  ticket,
  game,
  disabled,
  highlightKey,
  onChange,
  onCheck,
  checking,
  canCheck,
  missing,
}) {
  function update(patch) {
    onChange({ ...ticket, ...patch })
  }

  function setCell(comboIndex, cellIndex, raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 2)
    const combinations = ticket.combinations.map((combo, index) => {
      if (index !== comboIndex) return combo
      const numbers = combo.numbers.slice()
      numbers[cellIndex] = digits
      return { ...combo, numbers }
    })
    update({ combinations })
  }

  function addCombination() {
    if (ticket.combinations.length >= MAX_COMBINATIONS) return
    update({
      combinations: [
        ...ticket.combinations,
        { label: COMBINATION_LABELS[ticket.combinations.length], numbers: emptyNumbers() },
      ],
    })
  }

  function removeCombination(index) {
    const combinations = ticket.combinations
      .filter((_, position) => position !== index)
      .map((combo, position) => ({ ...combo, label: COMBINATION_LABELS[position] }))
    update({ combinations })
  }

  function clearAll() {
    update({
      category: null,
      drawDate: null,
      notes: [],
      combinations: [{ label: 'A', numbers: emptyNumbers() }],
    })
  }

  return (
    <section className="panel panel--stub" data-stub="Review" aria-labelledby="review-title">
      <div className="panel__head">
        <h2 id="review-title" className="panel__title">
          Ticket details
        </h2>
        <span className="panel__note">Edit anything the camera misread</span>
      </div>

      {ticket.notes?.length > 0 ? (
        <div className="status status--spaced" role="status">
          <p className="status__title">Some fields need a hand</p>
          <ul className="notes">
            {ticket.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div key={highlightKey} className="stack ticket-fill">
        <div className="field-grid">
          <label className="field">
            <span className="field__label">Game</span>
            <select
              className="select"
              value={ticket.category ?? ''}
              disabled={disabled}
              onChange={(event) => update({ category: event.target.value || null })}
            >
              <option value="">Choose a game</option>
              {JACKPOT_GAMES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field__hint">
              {game ? `Drawn ${drawDaysLabel(game)} at 9:00 PM.` : 'Major jackpot games only.'}
            </span>
          </label>

          <label className="field">
            <span className="field__label">Draw date</span>
            <input
              className="input"
              type="date"
              value={ticket.drawDate ?? ''}
              disabled={disabled}
              onChange={(event) => update({ drawDate: event.target.value || null })}
            />
            <span className="field__hint">The draw night printed on the ticket.</span>
          </label>
        </div>

        <div className="combinations">
          {ticket.combinations.map((combo, comboIndex) => {
            const issues = game ? checkCombination(toNumbers(combo.numbers), game) : []
            return (
              <div className="combination" key={combo.label}>
                <div className="combination__head">
                  <span className="combination__title">
                    <span className="label-chip" aria-hidden="true">
                      {combo.label}
                    </span>
                    Combination
                  </span>
                  {ticket.combinations.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn--quiet"
                      onClick={() => removeCombination(comboIndex)}
                      disabled={disabled}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="cells">
                  {combo.numbers.map((value, cellIndex) => (
                    <input
                      key={cellIndex}
                      className="numinput"
                      inputMode="numeric"
                      autoComplete="off"
                      aria-label={`Combination ${combo.label}, number ${cellIndex + 1}`}
                      aria-invalid={
                        game && cellIsInvalid(combo.numbers, cellIndex, game) ? 'true' : undefined
                      }
                      value={value}
                      disabled={disabled}
                      onChange={(event) => setCell(comboIndex, cellIndex, event.target.value)}
                    />
                  ))}
                </div>

                {issues.length > 0 ? (
                  <ul className="issues">
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="btn-row">
          <button
            type="button"
            className="btn btn--primary"
            onClick={onCheck}
            disabled={disabled || !canCheck}
          >
            {checking ? 'Checking…' : 'Check this ticket'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={addCombination}
            disabled={disabled || ticket.combinations.length >= MAX_COMBINATIONS}
          >
            Add combination
          </button>
          <button type="button" className="btn btn--quiet" onClick={clearAll} disabled={disabled}>
            Clear
          </button>
        </div>

        {!canCheck && missing ? <p className="field__hint">{missing}</p> : null}
        <p className="field__hint">
          A ticket holds one game and one draw date, with up to {MAX_COMBINATIONS} combinations.
        </p>
      </div>
    </section>
  )
}
