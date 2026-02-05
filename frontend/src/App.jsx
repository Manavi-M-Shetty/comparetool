// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ComparisonProvider, useComparison } from './context/ComparisonContext';
import UploadPage from './pages/UploadPage';
import ComparisonAndReviewPage from './pages/ComparisonAndReviewPage';
import ReportPreviewPage from './pages/ReportPreviewPage';
import WorkspaceModal from './components/WorkspaceModal';
import WorkspaceSidebar from './components/WorkspaceSidebar';
import StatusBanner from './components/StatusBanner';
import { useState, useEffect } from 'react';

// NEW: Delta Explorer page
import DeltaExplorerPage from './pages/DeltaExplorerPage';

// Simple, flat navigation link (uniform purple theme)
function NavLink({ to, children, icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-md
        text-xs md:text-sm font-medium border transition-colors
        ${
          isActive
            ? 'bg-purple-600 border-purple-600 text-white'
            : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'
        }`}
    >
      <span
        className={`flex-shrink-0 ${
          isActive ? 'text-white' : 'text-purple-500 group-hover:text-purple-700'
        }`}
      >
        {icon}
      </span>
      <span className="hidden md:inline whitespace-nowrap">{children}</span>
    </Link>
  );
}

function AppContent() {
  const {
    currentWorkspace,
    workspaces,
    createNewWorkspace,
    selectWorkspace,
  } = useComparison();

  const MODAL_FIRST_SHOWN_KEY = 'workspace_modal_shown_v1';
  const [showModal, setShowModal] = useState(() => {
    const savedWs = localStorage.getItem('current_workspace');
    return !savedWs;
  });

  useEffect(() => {
    try {
      const alreadyShown = localStorage.getItem(MODAL_FIRST_SHOWN_KEY);
      if (!alreadyShown) {
        setShowModal(true);
        localStorage.setItem(MODAL_FIRST_SHOWN_KEY, '1');
      }
    } catch (e) {
      console.warn('Failed to set modal first-load flag', e);
    }
  }, []);

  const getWorkspaceName = () => {
    if (!currentWorkspace) return null;
    if (typeof currentWorkspace === 'string') return currentWorkspace;
    if (typeof currentWorkspace === 'object' && currentWorkspace.name) {
      return currentWorkspace.name;
    }
    return null;
  };

  const workspaceName = getWorkspaceName();

  return (
    <div className="flex h-screen overflow-hidden bg-purple-50 text-slate-900 font-sans">
      {/* Left workspace navigation */}
      <WorkspaceSidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-purple-50">
        {/* Header */}
        <header className="shrink-0 border-b bg-white">
          <div className="px-4 py-2 flex items-center justify-between gap-4">
            {/* Left side: logo + nav */}
            <div className="flex items-center gap-6 min-w-0 flex-1">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-600 text-white">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                <div className="hidden sm:block leading-tight">
                  <h1 className="text-sm font-semibold text-slate-900">
                    Release Notes
                  </h1>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                    Automation Tool
                  </p>
                </div>
              </Link>

              {/* Navigation tabs */}
              <nav className="flex items-center gap-2 overflow-x-auto">
                <NavLink
                  to="/"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  }
                >
                  Upload
                </NavLink>

                <NavLink
                  to="/results"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  }
                >
                  Results
                </NavLink>

                <NavLink
                  to="/report"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                >
                  Report
                </NavLink>

                {/* NEW: Delta Explorer tab */}
                <NavLink
                  to="/delta"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m0-10V7a2 2 0 012-2h6l2 2h4"
                      />
                    </svg>
                  }
                >
                  Delta Explorer
                </NavLink>
              </nav>
            </div>

            {/* Right side: workspace indicator */}
            {workspaceName && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-purple-200 bg-purple-50 text-xs text-purple-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium">{workspaceName}</span>
              </div>
            )}
          </div>
        </header>

        {/* Status Banner row */}
        <div className="shrink-0 border-b bg-white">
          <StatusBanner />
        </div>

        {/* Main routed content */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <div className="h-full overflow-y-auto">
                  <UploadPage />
                </div>
              }
            />

            <Route path="/results" element={<ComparisonAndReviewPage />} />

            <Route
              path="/report"
              element={
                <div className="h-full overflow-y-auto p-4 md:p-6">
                  <ReportPreviewPage />
                </div>
              }
            />

            {/* NEW: Delta Explorer route */}
            <Route
              path="/delta"
              element={
                <div className="h-full overflow-y-auto">
                  <DeltaExplorerPage />
                </div>
              }
            />
          </Routes>
        </main>

        {/* Simple bottom divider */}
        <div className="h-px bg-purple-100" />
      </div>

      {/* Workspace Modal */}
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