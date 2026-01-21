
// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ComparisonProvider, useComparison } from './context/ComparisonContext';
import UploadPage from './pages/UploadPage';
import ComparisonAndReviewPage from './pages/ComparisonAndReviewPage';
import ReportPreviewPage from './pages/ReportPreviewPage';
import WorkspaceModal from './components/WorkspaceModal';
import WorkspaceSidebar from './components/WorkspaceSidebar';
import StatusBanner from './components/StatusBanner';
import { useState } from 'react';

function AppContent() {
  const {
    currentWorkspace,
    workspaces,
    createNewWorkspace,
    selectWorkspace,
  } = useComparison();

  // 🔹 Show modal only if there is NO saved workspace in localStorage
  const [showModal, setShowModal] = useState(() => {
    const savedWs = localStorage.getItem('current_workspace');
    return !savedWs; // true only for first-ever use
  });

  // We no longer auto-close the modal when currentWorkspace changes.
  // It will close when user selects/creates a workspace via WorkspaceModal
  // (onClose is called there), and after that user can use the sidebar.

  return (
    <div className="flex">
      <WorkspaceSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b p-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <Link to="/" className="font-bold">
              Config Compare Tool
            </Link>
            <nav className="text-sm text-gray-600">
              <Link to="/" className="mr-3">
                Upload
              </Link>
              <Link to="/results" className="mr-3">
                Results &amp; Review
              </Link>
              <Link to="/report" className="mr-3">
                Report
              </Link>
            </nav>
          </div>
        </header>

        {/* Global status banner */}
        <StatusBanner />

        <main className="py-4 flex-1">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route
              path="/results"
              element={<ComparisonAndReviewPage />}
            />
            <Route path="/report" element={<ReportPreviewPage />} />
          </Routes>
        </main>
      </div>

      {/* Workspace selection modal – only shown when showModal is true */}
      {showModal && (
        <WorkspaceModal
          onCreate={async (name) => {
            await createNewWorkspace(name);
            setShowModal(false);
          }}
          onSelect={async (name) => {
            await selectWorkspace(name);
            setShowModal(false);
          }}
          workspaces={workspaces}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ComparisonProvider>
        <AppContent />
      </ComparisonProvider>
    </BrowserRouter>
  );
}

export default App;
