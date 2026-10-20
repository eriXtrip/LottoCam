import { Link } from 'react-router-dom'

export default function DisclaimerPage() {
  return (
    <div className="section" style={{ maxWidth: '48rem', marginInline: 'auto' }}>
      <div className="page-head">
        <p className="eyebrow">Legal & Information</p>
        <h1 className="page-title">Disclaimer</h1>
        <p className="page-lede">Read this disclaimer carefully before using LottoCam.</p>
      </div>
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>General Disclaimer</h2>
          <p>This is a personal/educational project. The author assumes no responsibility for any use or misuse. LottoCam is not an official PCSO product.</p>
        </section>
        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>Accuracy of Information</h2>
          <p>Results and information provided by this site/app may be inaccurate or out of date. Always verify against the official PCSO website before claiming prizes.</p>
        </section>
        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>Limitation of Liability</h2>
          <p>Under no circumstances will the author be liable for any loss or damage arising from the use of this tool.</p>
        </section>
        <section>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--royal-blue)', marginBottom: 'var(--s-2)' }}>Non-Affiliation</h2>
          <p>LottoCam is an independent utility and is not affiliated with, endorsed by, certified by, or connected to PCSO or any government agency.</p>
        </section>
        <div style={{ paddingTop: 'var(--s-4)', borderTop: '1px solid var(--line)' }}>
          <Link to="/" className="btn btn--primary">Back to scanner</Link>
        </div>
      </div>
    </div>
  )
}
