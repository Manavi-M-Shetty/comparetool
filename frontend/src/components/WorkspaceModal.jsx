// frontend/src/components/WorkspaceModal.jsx
import React, { useState, useEffect } from 'react';

export default function WorkspaceModal({ onCreate, onSelect, workspaces, onClose }) {
  const [mode, setMode] = useState(null);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter workspaces based on search
  const filteredWorkspaces = workspaces.filter(ws => 
    ws.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onCreate(newName.trim());
      onClose();
    } catch (e) {
      alert('Failed to create workspace: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (name) => {
    setIsLoading(true);
    try {
      await onSelect(name);
      onClose();
    } catch (e) {
      alert('Failed to select workspace: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && mode === 'create') {
      handleCreate();
    }
    if (e.key === 'Escape') {
      if (mode) {
        setMode(null);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, newName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[150px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Modal container */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 rounded-3xl blur-xl opacity-75" />
        
        {/* Modal content */}
        <div className="relative bg-slate-900/95 backdrop-blur-2xl border border-purple-500/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent line */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
          
          {/* Header */}
          <div className="pt-8 pb-6 px-8 text-center">
            {/* Logo/Icon */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-purple-500/30 rounded-2xl blur-xl" />
              <div className="relative p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-500/30">
                <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-2">
              {!mode ? 'Welcome Back' : mode === 'create' ? 'New Workspace' : 'Select Workspace'}
            </h2>
            <p className="text-sm text-gray-500">
              {!mode 
                ? 'Choose how you want to continue' 
                : mode === 'create' 
                  ? 'Give your workspace a unique name'
                  : 'Resume your previous work'
              }
            </p>
          </div>

          {/* Content */}
          <div className="px-8 pb-8">
            {/* Initial mode selection */}
            {!mode && (
              <div className="space-y-4">
                {/* Create new button */}
                <button
                  onClick={() => setMode('create')}
                  className="group relative w-full overflow-hidden"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition-all transform hover:-translate-y-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create New Workspace</span>
                  </div>
                </button>

                {/* Divider */}
                <div className="relative flex items-center py-4">
                  <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                  <span className="flex-shrink-0 mx-4 text-xs text-gray-600 uppercase tracking-wider">or continue with</span>
                  <div className="flex-grow h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                </div>

                {/* Select existing button */}
                <button
                  onClick={() => setMode('select')}
                  disabled={workspaces.length === 0}
                  className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl text-gray-300 hover:text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                  <span>Open Existing Workspace</span>
                  {workspaces.length > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                      {workspaces.length}
                    </span>
                  )}
                </button>

                {workspaces.length === 0 && (
                  <p className="text-center text-xs text-gray-600 mt-2">
                    No existing workspaces found
                  </p>
                )}
              </div>
            )}

            {/* Create mode */}
            {mode === 'create' && (
              <div className="space-y-6">
                {/* Input */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur opacity-0 focus-within:opacity-100 transition-opacity" />
                  <input
                    type="text"
                    placeholder="e.g., Project Alpha, Release v2.0"
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    className="relative w-full px-4 py-4 bg-black/40 border border-purple-500/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                  />
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap gap-2">
                  {['Sprint 1', 'Production', 'Development', 'Testing'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setNewName(suggestion)}
                      className="px-3 py-1.5 text-xs bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg text-gray-400 hover:text-purple-300 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setMode(null);
                      setNewName('');
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white font-medium transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 rounded-xl text-white font-semibold transition-all disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Keyboard hint */}
                <p className="text-center text-xs text-gray-600">
                  Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">Enter</kbd> to create
                </p>
              </div>
            )}

            {/* Select mode */}
            {mode === 'select' && (
              <div className="space-y-4">
                {/* Search */}
                {workspaces.length > 5 && (
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search workspaces..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>
                )}

                {/* Workspace list */}
                <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent pr-2">
                  {filteredWorkspaces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-3 rounded-full bg-gray-800/50 mb-3">
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">
                        {searchTerm ? 'No matching workspaces' : 'No workspaces found'}
                      </p>
                    </div>
                  ) : (
                    filteredWorkspaces.map((ws, index) => (
                      <button
                        key={ws}
                        onClick={() => handleSelect(ws)}
                        disabled={isLoading}
                        className="group w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 border border-white/10 hover:border-purple-500/30 rounded-xl text-left transition-all duration-200 disabled:opacity-50"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center group-hover:border-purple-500/40 transition-colors">
                          <span className="text-lg font-bold text-purple-400">
                            {ws.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate transition-colors">
                            {ws}
                          </p>
                          <p className="text-xs text-gray-600">
                            Click to open
                          </p>
                        </div>

                        {/* Arrow */}
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))
                  )}
                </div>

                {/* Back button */}
                <button
                  onClick={() => {
                    setMode(null);
                    setSearchTerm('');
                  }}
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white font-medium transition-all"
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-black/20 border-t border-white/5">
            <p className="text-center text-xs text-gray-600">
              Release Notes Automation Tool
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}