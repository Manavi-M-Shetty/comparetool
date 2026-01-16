import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { ComparisonProvider } from './context/ComparisonContext'
import UploadPage from './pages/UploadPage'
import ComparisonResultsPage from './pages/ComparisonResultsPage'
import ReviewAndEditPage from './pages/ReviewAndEditPage'
import ReportPreviewPage from './pages/ReportPreviewPage'


function App(){
  return (
    <BrowserRouter>
      <ComparisonProvider>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b p-3">
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              <Link to="/" className="font-bold">Config Compare Tool</Link>
              <nav className="text-sm text-gray-600">
                <Link to="/" className="mr-3">Upload</Link>
                <Link to="/results" className="mr-3">Results</Link>
                <Link to="/review" className="mr-3">Review</Link>
                <Link to="/report" className="mr-3">Report</Link>
              </nav>
            </div>
          </header>

          <main className="py-4">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/results" element={<ComparisonResultsPage />} />
              <Route path="/review" element={<ReviewAndEditPage />} />
              <Route path="/report" element={<ReportPreviewPage />} />
            </Routes>
          </main>
        </div>
      </ComparisonProvider>
    </BrowserRouter>
  )
}

export default App