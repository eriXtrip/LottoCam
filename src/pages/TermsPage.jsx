import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="section" style={{ maxWidth: '48rem', marginInline: 'auto' }}>
      <div className="page-head">
        <p className="eyebrow">Legal & Information</p>
        <h1 className="page-title">Terms of Use</h1>
        <p className="page-lede">
          Please read these terms carefully before using LottoCam. By accessing or using this
          utility, you agree to these terms.
        </p>
      </div>

      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>
            1. Developer & Project Information
          </h2>
          <p>
            <strong>LottoCam</strong> is an independent open-web software utility created and developed
            by <strong>Jon Eric D. Tripulca</strong>. It is designed as a camera-assisted ticket
            verification tool for players of Philippine lottery games.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>
            2. Non-Affiliation Disclaimer
          </h2>
          <p>
            LottoCam is <strong>not affiliated, associated, authorized, endorsed by, or in any way
            officially connected</strong> with the Philippine Charity Sweepstakes Office (PCSO), the
            Government of the Philippines, or any of their subsidiaries or affiliates.
          </p>
          <p style={{ marginTop: 'var(--s-2)' }}>
            The names &ldquo;PCSO&rdquo;, &ldquo;Lotto 6/42&rdquo;, &ldquo;Mega Lotto 6/45&rdquo;,
            &ldquo;Super Lotto 6/49&rdquo;, &ldquo;Grand Lotto 6/55&rdquo;, and &ldquo;Ultra Lotto
            6/58&rdquo;, as well as related trademarks and logos, are registered trademarks of their
            respective statutory owners.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>
            3. Informational & Reference Purpose Only
          </h2>
          <p>
            All draw numbers, schedules, jackpot amounts, and verification results provided by LottoCam
            are aggregated from independent third-party sources (including LottoResulta) for
            informational and convenience purposes only.
          </p>
          <p style={{ marginTop: 'var(--s-2)' }}>
            <strong>Official Verification Mandatory:</strong> You must always confirm your physical
            lottery ticket and the officially published winning numbers through an authorized PCSO
            outlet or via the official PCSO portal at{' '}
            <a href="https://www.pcso.gov.ph" target="_blank" rel="noreferrer">
              pcso.gov.ph
            </a>{' '}
            before claiming any prize, discarding any ticket, or making financial decisions.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>
            4. No Gaming, Betting, or Financial Services
          </h2>
          <p>
            LottoCam is strictly an optical scanning and number-checking assistant. It does not sell
            lottery tickets, accept bets, pool tickets, process lottery wagers, or facilitate prize
            payouts. No money is handled, held, or wagered through this application.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>
            5. Privacy & Device-Only Processing
          </h2>
          <p>
            Ticket photos and live camera feeds never leave your device. All optical character
            recognition (OCR) is performed entirely in your web browser (client-side). No personal
            data, ticket images, or combination numbers are transmitted to, stored on, or harvested
            by remote servers.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>
            6. Limitation of Liability
          </h2>
          <p>
            The developer (<strong>Jon Eric D. Tripulca</strong>) and LottoCam provide this service
            on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any
            kind.
          </p>
          <p style={{ marginTop: 'var(--s-2)' }}>
            In no event shall the developer be liable for any direct, indirect, incidental, or
            consequential damages, including but not limited to missed lottery claim deadlines,
            OCR scanning inaccuracies, network downtime, or discrepancies in third-party draw feeds.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>
            7. Age Requirement & Responsible Play
          </h2>
          <p>
            In compliance with Philippine regulations, participants in PCSO lottery games must be at
            least 18 years of age. LottoCam promotes responsible play.
          </p>
        </section>

        <div style={{ paddingTop: 'var(--s-4)', borderTop: '1px solid var(--line)' }}>
          <Link to="/" className="btn btn--primary">
            Back to scanner
          </Link>
        </div>
      </div>
    </div>
  )
}
