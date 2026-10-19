import { Link, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import ScanPage from './pages/ScanPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import TermsPage from './pages/TermsPage.jsx'

function NotFound() {
  return (
    <div className="page-head">
      <p className="eyebrow">404</p>
      <h1 className="page-title">That page is not here</h1>
      <p className="page-lede">
        The address you followed does not match anything in LottoCam. Start from the scanner.
      </p>
      <p>
        <Link className="btn btn--primary" to="/">
          Back to the scanner
        </Link>
      </p>
    </div>
  )
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ScanPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  )
}
