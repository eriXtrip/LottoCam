import { Link, NavLink } from 'react-router-dom'
import InstallApp from './InstallApp.jsx'

export default function AppShell({ children }) {
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
                <a href="mailto:jonerictripulca@gmail.com">Available for freelance/web work</a>
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
