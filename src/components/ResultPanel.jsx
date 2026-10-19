import { formatDrawDate, formatPeso } from '../lib/format.js'

function Verdict({ result }) {
  if (result.state === 'pending') {
    return <span className="result__verdict result__verdict--none">Awaiting result</span>
  }
  if (result.won) return <span className="result__verdict">Winner</span>
  return <span className="result__verdict result__verdict--none">Play more</span>
}

function ResultRow({ result }) {
  const winning = result.winningNumbers ?? []
  const held = new Set(result.numbers ?? [])
  const className = result.won ? 'result result--win' : 'result'

  return (
    <article className={className}>
      <div className="result__head">
        <span className="label-chip" aria-hidden="true">
          {result.label}
        </span>
        <span className="result__title">Combination</span>
        <Verdict result={result} />
      </div>

      <ul className="numbers">
        {(result.numbers ?? []).map((value, index) => (
          <li key={index} className="numball">
            {String(value).padStart(2, '0')}
          </li>
        ))}
      </ul>

      {result.state === 'pending' ? <p className="result__detail">{result.message}</p> : null}
      {result.state === 'error' ? (
        <p className="result__detail result__detail--error">{result.message}</p>
      ) : null}

      {result.state === 'ready' ? (
        <>
          <p className="result__detail">
            Matched {result.matchedCount} of 6 against the drawn numbers.
          </p>

          {winning.length > 0 ? (
            <>
              <p className="field__hint">Drawn numbers</p>
              <ul className="numbers">
                {winning.map((value, index) => (
                  <li key={index} className={held.has(value) ? 'numball numball--match' : 'numball'}>
                    {String(value).padStart(2, '0')}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {result.tiers?.length > 0 ? (
            <ul className="tiers">
              {result.tiers.map((tier) => (
                <li key={tier.tier}>
                  {tier.label}
                  {typeof tier.amountPerLine === 'number'
                    ? `: ${formatPeso(tier.amountPerLine)} a line`
                    : ': pari-mutuel pool'}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </article>
  )
}

export default function ResultPanel({ status, results, game, drawDate }) {
  const reference = [game?.label, formatDrawDate(drawDate)].filter(Boolean).join(' · ')

  return (
    <section className="panel" aria-labelledby="result-title">
      <div className="panel__head">
        <h2 id="result-title" className="panel__title">
          Check result
        </h2>
        <span className="panel__note">{game ? game.label : 'No game yet'}</span>
      </div>

      {status === 'checking' ? (
        <div className="result-skeleton" role="status" aria-live="polite">
          <div className="result-skeleton__head">
            <div className="skeleton-ball skeleton-ball--chip" />
            <div className="skeleton-bar skeleton-bar--sm" />
          </div>
          <div className="result-skeleton__numbers">
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
            <div className="skeleton-ball" />
          </div>
          <div className="result-skeleton__status">
            <span className="skeleton-dot" aria-hidden="true" />
            <span>Checking combinations against the live draw…</span>
          </div>
        </div>
      ) : null}

      {status === 'idle' ? (
        <div className="status">
          <p className="status__title">Nothing checked yet</p>
          <p>
            Scan a ticket or type its numbers, then check it against the draw. Results come from a
            live feed of PCSO draws.
          </p>
        </div>
      ) : null}

      {status === 'done' ? (
        <div className="stack">
          {reference ? <p className="field__hint">{reference}</p> : null}
          {results.length === 0 ? (
            <p className="result__detail">Nothing to check.</p>
          ) : (
            results.map((result) => <ResultRow key={result.label} result={result} />)
          )}
        </div>
      ) : null}
    </section>
  )
}
