// frontend/src/App.jsx
/**
 * Main application router and layout component.
 *
 * Structure:
 * - Left sidebar: Workspace and environment selection
 * - Top header: Navigation tabs and status banner
 * - Main content: Page-specific content based on route
 *
 * Routes:
 * - / (Upload): Select folders and initiate comparison
 * - /results (Comparison): View and interact with comparison results
 * - /report (Report): Report generation and Excel updates
 * - /delta (Delta Explorer): Database delta migration viewing
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ComparisonProvider, useComparison } from './context/ComparisonContext';
import UploadPage from './pages/UploadPage';
import ComparisonAndReviewPage from './pages/ComparisonAndReviewPage';
import WorkspaceModal from './components/WorkspaceModal';
import WorkspaceSidebar from './components/WorkspaceSidebar';
import StatusBanner from './components/StatusBanner';
import { useState } from 'react';
import DeltaExplorerPage from './pages/DeltaExplorerPage';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/ThemeContext';

/**
 * Navigation link component with active state highlighting.
 */
function NavLink({ to, children, icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  const base =
    'group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium border transition-colors';

  const activeClasses =
    'bg-purple-600 border-purple-600 text-white ' +
    'dark:bg-purple-500 dark:border-purple-500 dark:text-white';

  const inactiveClasses =
    'bg-white border-purple-200 text-purple-700 hover:bg-purple-50 ' +
    'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700';

  return (
    <Link to={to} className={`${base} ${isActive ? activeClasses : inactiveClasses}`}>
      <span
        className={
          'flex-shrink-0 ' +
          (isActive
            ? 'text-white'
            : 'text-purple-500 group-hover:text-purple-700 ' +
              'dark:text-purple-300 dark:group-hover:text-purple-200')
        }
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

  const { theme, toggleTheme } = useTheme();

  const MODAL_FIRST_SHOWN_KEY = 'workspace_modal_shown_v1';

  // Show modal ONLY the very first time the app is opened in this browser.
  const [showModal, setShowModal] = useState(() => {
    try {
      const alreadyShown = localStorage.getItem(MODAL_FIRST_SHOWN_KEY);
      return !alreadyShown; // true if not yet shown
    } catch {
      return true;
    }
  });

  // Common close handler that also sets the "shown once" flag.
  const closeWorkspaceModal = () => {
    try {
      localStorage.setItem(MODAL_FIRST_SHOWN_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setShowModal(false);
  };

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
    <div className="flex h-screen overflow-hidden bg-purple-50 text-slate-900 font-sans dark:bg-slate-900 dark:text-slate-50">
      {/* Left workspace navigation */}
      <WorkspaceSidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col h-screen min-h-0 overflow-hidden bg-purple-50 dark:bg-slate-900">
        {/* Header */}
        <header className="shrink-0 border-b bg-white dark:bg-slate-800 dark:border-slate-700">
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
                  <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Release Notes
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
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

                {/* Delta Explorer tab */}
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

            {/* Right side: theme toggle + workspace indicator */}
            <div className="hidden md:flex items-center gap-3">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-purple-400 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/60
                           dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:border-purple-400"
                title="Toggle light / dark mode"
              >
                {theme === 'dark' ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v1.5M18.364 5.636l-1.06 1.06M21 12h-1.5M18.364 18.364l-1.06-1.06M12 19.5V21M6.636 18.364l1.06-1.06M4.5 12H3M6.636 5.636l1.06 1.06M12 8a4 4 0 100 8 4 4 0 000-8z"
                      />
                    </svg>
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                      />
                    </svg>
                    <span>Dark</span>
                  </>
                )}
              </button>

              {workspaceName && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-purple-200 bg-purple-50 text-xs text-purple-700
                                dark:border-purple-500/40 dark:bg-purple-900/40 dark:text-purple-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">{workspaceName}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Status Banner row */}
        <div className="shrink-0 border-b bg-white dark:bg-slate-800 dark:border-slate-700">
          <StatusBanner />
        </div>

        {/* Main routed content */}
        <main className="flex-1 overflow-hidden min-h-0">
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
        <div className="h-px bg-purple-100 dark:bg-slate-700" />
      </div>

      {/* Workspace Modal as landing page (first time only) */}
      {showModal && (
        <WorkspaceModal
          onCreate={async (name) => {
            await createNewWorkspace(name);
            closeWorkspaceModal();
          }}
          onSelect={async (name) => {
            await selectWorkspace(name);
            closeWorkspaceModal();
          }}
          workspaces={workspaces}
          onClose={closeWorkspaceModal}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ComparisonProvider>
          <AppContent />
        </ComparisonProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;