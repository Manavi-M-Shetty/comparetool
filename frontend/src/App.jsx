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

// Navigation Link Component
function NavLink({ to, children, icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        transition-all duration-300 group
        ${isActive 
          ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/30' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg -z-10" />
      )}
      
      <span className={`transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-purple-400'}`}>
        {icon}
      </span>
      
      <span className="hidden md:inline">{children}</span>
      
      {isActive && (
        <span className="md:hidden absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full" />
      )}
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

  // Trigger WorkspaceModal on very first app load (exactly once).
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

  // ✅ Helper function to get workspace display name
  const getWorkspaceName = () => {
    if (!currentWorkspace) return null;
    // Handle both string and object formats
    if (typeof currentWorkspace === 'string') return currentWorkspace;
    if (typeof currentWorkspace === 'object' && currentWorkspace.name) return currentWorkspace.name;
    return null;
  };

  const workspaceName = getWorkspaceName();

  return (
    <div className="flex h-screen overflow-hidden text-gray-100 font-sans">
      <WorkspaceSidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#0a0612]">
        {/* Ambient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-900/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px]" />
        </div>

        {/* Header */}
        <header className="relative z-20 shrink-0">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          
          <div className="bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
            <div className="w-full px-4 py-3">
              <div className="flex items-center justify-between">
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                      Release Notes
                    </h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest -mt-0.5">
                      Automation Tool
                    </p>
                  </div>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1 md:gap-2">
                  <NavLink 
                    to="/" 
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    }
                  >
                    Upload
                  </NavLink>
                  
                  <NavLink 
                    to="/results" 
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                  >
                    Results
                  </NavLink>
                  
                  <NavLink 
                    to="/report" 
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  >
                    Report
                  </NavLink>
                </nav>

                {/* ✅ FIXED: Workspace indicator */}
                {workspaceName && (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400">
                      <span className="text-purple-300 font-medium">{workspaceName}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Status Banner */}
        <div className="relative z-10 shrink-0">
          <StatusBanner />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative z-0">
          <Routes>
            <Route 
              path="/" 
              element={
                <div className="h-full overflow-y-auto">
                  <UploadPage />
                </div>
              } 
            />
            
            <Route
              path="/results"
              element={<ComparisonAndReviewPage />}
            />
            
            <Route 
              path="/report" 
              element={
                <div className="h-full overflow-y-auto p-6">
                  <ReportPreviewPage />
                </div>
              } 
            />
          </Routes>
        </main>

        {/* Footer accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none z-10" />
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