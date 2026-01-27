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

  const [showModal, setShowModal] = useState(() => {
    const savedWs = localStorage.getItem('current_workspace');
    return !savedWs; 
  });

  return (
    <div className="flex h-screen overflow-hidden text-gray-100 font-sans">
      <WorkspaceSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#0f0718]">
        
        {/* Header */}
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 p-3 shrink-0 z-20">
          <div className="w-full px-4 flex items-center justify-between">
            <Link 
              to="/" 
              className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 hover:opacity-80 transition-opacity"
            >
              Release-Note Automation Tool
            </Link>
            <nav className="text-xs font-medium uppercase tracking-wide">
              <Link 
                to="/" 
                className="mr-6 text-gray-400 hover:text-purple-300 transition-colors"
              >
                Upload
              </Link>
              <Link 
                to="/results" 
                className="mr-6 text-gray-400 hover:text-purple-300 transition-colors"
              >
                Results &amp; Review
              </Link>
              <Link 
                to="/report" 
                className="text-gray-400 hover:text-purple-300 transition-colors"
              >
                Report
              </Link>
            </nav>
          </div>
        </header>

        {/* Global status banner */}
        <div className="z-10 shrink-0">
            <StatusBanner />
        </div>

        {/* Main Content Area - Changed to take full width/height */}
        <main className="flex-1 overflow-hidden relative">
            <Routes>
              {/* Upload page keeps a centered layout */}
              <Route path="/" element={
                <div className="h-full overflow-y-auto p-6">
                   <UploadPage />
                </div>
              } />
              
              {/* Results page takes full space without padding constraints */}
              <Route
                path="/results"
                element={<ComparisonAndReviewPage />}
              />
              
              {/* Report page keeps centered layout */}
              <Route path="/report" element={
                 <div className="h-full overflow-y-auto p-6">
                    <ReportPreviewPage />
                 </div>
              } />
            </Routes>
        </main>
      </div>

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