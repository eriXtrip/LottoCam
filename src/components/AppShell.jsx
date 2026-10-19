import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function AppShell({ children }) {
  const [isTermsOpen, setIsTermsOpen] = useState(false)

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-header__inner">
          <NavLink to="/" className="brand">
            <span className="brand__mark" aria-hidden="true" />
            <span>
              <span className="brand__name">LottoCam</span>
              <span className="brand__tag">PCSO jackpot ticket reader</span>
            </span>
          </NavLink>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end className="nav__link">
              Scan
            </NavLink>
            <NavLink to="/results" className="nav__link">
              Latest draws
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="shell-main">{children}</main>

      <footer className="shell-footer">
        <div className="shell-footer__inner">
          <div className="shell-footer__top">
            <div className="shell-footer__brand">
              <span className="brand__name" style={{ fontSize: '1.15rem' }}>
                LottoCam
              </span>
              <p className="shell-footer__dev">
                Developed by <strong>Jon Eric D. Tripulca</strong>
              </p>
            </div>

            <nav className="shell-footer__nav" aria-label="Footer links">
              <button
                type="button"
                className="footer-link-btn"
                onClick={() => setIsTermsOpen(true)}
              >
                Terms of Use
              </button>
              <span aria-hidden="true">•</span>
              <Link to="/terms">
                Full Legal Page
              </Link>
              <span aria-hidden="true">•</span>
              <a
                href="https://www.pcso.gov.ph/SearchLottoResult.aspx"
                target="_blank"
                rel="noreferrer"
              >
                Official PCSO Results
              </a>
              <span aria-hidden="true">•</span>
              <a href="https://lottoresulta.com" target="_blank" rel="noreferrer">
                LottoResulta API
              </a>
            </nav>
          </div>

          <div className="shell-footer__disclaimer">
            <p>
              <strong>Non-Affiliation Disclaimer:</strong> LottoCam is an independent open-web
              utility created and developed by <strong>Jon Eric D. Tripulca</strong>. It is not
              affiliated with, endorsed by, certified by, or connected to the Philippine Charity
              Sweepstakes Office (PCSO) or any government agency.
            </p>
            <p>
              <strong>Verification Requirement:</strong> All numbers, jackpots, and results are
              aggregated for reference and convenience only. Always confirm winning combinations at
              an authorized PCSO outlet or on{' '}
              <a href="https://www.pcso.gov.ph" target="_blank" rel="noreferrer">
                pcso.gov.ph
              </a>{' '}
              before claiming any prize or discarding a ticket.
            </p>
            <p>
              <strong>Privacy & On-Device Processing:</strong> Ticket photos and camera streams
              never leave your device. All OCR text extraction runs 100% locally in your browser.
              No tickets, numbers, or images are stored or uploaded to any remote server.
            </p>
            <p>
              <strong>Responsible Play:</strong> Must be 18 years or older to participate in PCSO
              lottery games. Play responsibly.
            </p>
          </div>

          <div className="shell-footer__bottom">
            <span>
              © {new Date().getFullYear()} LottoCam • Developed by Jon Eric D. Tripulca
            </span>
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>

      {/* Terms of Use Modal */}
      {isTermsOpen ? (
        <div
          className="ticket-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTermsOpen(false)
          }}
          role="presentation"
        >
          <div
            className="ticket-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            style={{ maxWidth: '46rem' }}
          >
            <div className="ticket-modal__head">
              <div>
                <span className="ticket-modal__tag">Legal agreement</span>
                <h2 id="terms-modal-title" className="ticket-modal__title">
                  Terms of Use
                </h2>
              </div>
              <button
                type="button"
                className="ticket-modal__close"
                onClick={() => setIsTermsOpen(false)}
                aria-label="Close Terms of Use"
              >
                ✕
              </button>
            </div>

            <div className="ticket-modal__body" style={{ gap: 'var(--s-4)' }}>
              <section>
                <h3 style={{ fontSize: '1rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-1)' }}>
                  1. Developer Attribution
                </h3>
                <p>
                  <strong>LottoCam</strong> is an independent software tool developed by{' '}
                  <strong>Jon Eric D. Tripulca</strong>.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: '1rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-1)' }}>
                  2. Non-Affiliation Disclaimer
                </h3>
                <p>
                  LottoCam is not affiliated, endorsed by, certified by, or connected to the
                  Philippine Charity Sweepstakes Office (PCSO) or any Philippine government entity.
                  All PCSO game names, logos, and trademarks belong to their respective statutory owners.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: '1rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-1)' }}>
                  3. Information & Reference Purpose
                </h3>
                <p>
                  Drawn numbers and verification results are aggregated for informational and
                  convenience purposes only. Always verify your physical lottery ticket with an
                  authorized PCSO retail outlet or at{' '}
                  <a href="https://www.pcso.gov.ph" target="_blank" rel="noreferrer">
                    pcso.gov.ph
                  </a>{' '}
                  before claiming any prize or discarding your ticket.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: '1rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-1)' }}>
                  4. No Betting or Gambling Services
                </h3>
                <p>
                  LottoCam is strictly an optical ticket reader. It does not sell lottery tickets,
                  collect bets, process wagers, or distribute prizes.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: '1rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-1)' }}>
                  5. Client-Side Privacy
                </h3>
                <p>
                  Ticket scanning runs 100% locally in your browser. Camera frames and ticket images
                  are never transmitted to or stored on any server.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: '1rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-1)' }}>
                  6. Limitation of Liability
                </h3>
                <p>
                  The developer (Jon Eric D. Tripulca) and LottoCam disclaim all liability for any
                  damages, missed prize claim deadlines, OCR recognition inaccuracies, or reliance
                  on third-party draw feeds.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: '1rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-1)' }}>
                  7. Age Restriction
                </h3>
                <p>
                  Participants in PCSO lottery games must be at least 18 years of age. Please play
                  responsibly.
                </p>
              </section>

              <div className="btn-row" style={{ marginTop: 'var(--s-3)' }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setIsTermsOpen(false)}
                >
                  Close
                </button>
                <Link
                  to="/terms"
                  className="btn btn--ghost"
                  onClick={() => setIsTermsOpen(false)}
                >
                  View full terms page
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
