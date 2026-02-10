import React, { useState, useEffect } from 'react';

export default function WorkspaceModal({ onCreate, onSelect, workspaces = [], onClose }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'select'
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWorkspaces = (workspaces || []).filter((ws) =>
    ws.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      await onCreate(trimmed);
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
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, newName]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      {/* Card container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden
                      dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 md:px-8 py-5 border-b border-slate-200 flex items-center justify-between gap-4
                        dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-purple-600 text-white">
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
            <div>
              <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
                Release Notes Automation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure workspaces, environments, and servers before comparing configs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/60
                       dark:text-slate-500 dark:hover:text-slate-100 dark:hover:bg-slate-800"
            title="Skip for now"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 md:px-8 py-5 bg-slate-50 dark:bg-slate-900">
          {/* Intro row */}
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                A <span className="font-semibold">workspace</span> groups environments and servers
                for a project or release. Each server keeps its own comparison history, Excel path,
                and review session.
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
                Configure multiple environments (LAB / SIT / UAT / PROD)
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
                Map servers to OLD / NEW config folders and Excel
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
                Resume previous comparison sessions per server
              </li>
            </ul>
          </div>

          {/* INITIAL MODE: choose create or select */}
          {!mode && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Create new workspace card */}
              <button
                type="button"
                onClick={() => setMode('create')}
                className="w-full text-left rounded-xl border border-purple-200 bg-white hover:border-purple-400 hover:shadow-md transition-all px-4 py-3 flex flex-col gap-2
                           dark:bg-slate-900 dark:border-purple-500/40 dark:hover:border-purple-500 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-purple-600 text-white">
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Start a new workspace
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Use this for a new project or release. You’ll add environments and servers from
                  the left sidebar.
                </p>
                <ul className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <li>• Keeps comparisons separate per server.</li>
                  <li>• Stores folder paths and Excel locations.</li>
                </ul>
              </button>

              {/* Open existing workspace card */}
              <button
                type="button"
                onClick={() => workspaces.length && setMode('select')}
                disabled={workspaces.length === 0}
                className={`w-full text-left rounded-xl border px-4 py-3 flex flex-col gap-2 transition-all ${
                  workspaces.length === 0
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md dark:bg-slate-900 dark:border-slate-700 dark:hover:border-purple-400 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 text-purple-600 dark:bg-slate-800 dark:text-purple-300">
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
                        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Open existing workspace
                    </span>
                    {workspaces.length > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-500/40">
                        {workspaces.length} available
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Restore environments, servers, compare results, and Excel settings from a previous
                  session.
                </p>
                {workspaces.length === 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 italic mt-1">
                    No workspaces yet &mdash; start by creating one.
                  </p>
                )}
              </button>
            </div>
          )}

          {/* CREATE MODE */}
          {mode === 'create' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Give your workspace a clear name. This might be a project name, migration window, or
                release identifier.
              </p>

              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g., Billing-Migration-UAT, CoreBanking-Release-2025Q1"
                  className="w-full px-4 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                             dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {['CoreBanking-UAT', 'Release-v3.2', 'CustomerPortal-Prod', 'Integration-Test'].map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewName(s)}
                      className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors
                                 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-purple-400 dark:hover:text-purple-200"
                    >
                      {s}
                    </button>
                  )
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode(null);
                    setNewName('');
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-xs md:text-sm font-medium text-slate-700 px-3 py-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/60
                             dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 text-white text-xs md:text-sm font-medium px-3 py-2 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/60 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span>Create workspace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SELECT MODE */}
          {mode === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Pick a workspace to restore its environments, servers, and previous comparison
                sessions.
              </p>

              {workspaces.length > 5 && (
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search workspaces..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400
                               focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                               dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {filteredWorkspaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-slate-200 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700">
                    <svg
                      className="w-6 h-6 text-slate-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {searchTerm ? 'No matching workspaces' : 'No workspaces found'}
                    </p>
                  </div>
                ) : (
                  filteredWorkspaces.map((ws) => (
                    <button
                      key={ws}
                      type="button"
                      onClick={() => handleSelect(ws)}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-slate-200 bg-white text-left hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-60
                                 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-purple-400"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-50 text-purple-700 text-sm font-semibold dark:bg-purple-900/40 dark:text-purple-100">
                        {ws.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                          {ws}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Click to restore environments &amp; servers
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode(null);
                    setSearchTerm('');
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-xs md:text-sm font-medium text-slate-700 px-3 py-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/60
                             dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center rounded-md bg-slate-100 text-xs md:text-sm font-medium text-slate-700 px-3 py-2 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60
                             dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Small footer strip */}
        <div className="px-6 md:px-8 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500
                        dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
          <span>Tip: You can always change workspace from the left sidebar.</span>
          <span className="hidden sm:inline">Release Notes Automation Tool</span>
        </div>
      </div>
    </div>
  );
}