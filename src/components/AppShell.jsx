import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import InstallApp from './InstallApp.jsx'

export default function AppShell({ children }) {
  const [copied, setCopied] = useState(false)
  const email = 'jonerictripulca@gmail.com'

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = email
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }
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
            <InstallApp />
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
              <p className="shell-footer__dev">
                Available for freelance/web work
              </p>
              <p className="shell-footer__dev">
                <a href={`mailto:${email}?subject=Freelance%20work%20inquiry%20-%20LottoCam`}>
                  Open in email app
                </a>
                {' • '}
                <button
                  type="button"
                  onClick={copyEmail}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                  }}
                >
                  {copied ? 'Copied!' : 'Copy email'}
                </button>
                {' '}— <span style={{ userSelect: 'all' }}>{email}</span>
              </p>
            </div>

            <nav className="shell-footer__nav" aria-label="Footer links">
              <Link to="/terms">
                Terms of Use
              </Link>
              <span aria-hidden="true">•</span>
              <Link to="/disclaimer">
                Disclaimer
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
    </div>
  )
}
