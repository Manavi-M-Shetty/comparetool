// frontend/src/components/WorkspaceModal.jsx

/**
 * First‑time workspace setup modal.
 *
 * Features:
 * - Ask for new workspace name
 * - Ask for initial environment name
 * - Ask for initial server name
 * - Keyboard shortcuts: Enter to create, Escape to close
 */

import React, { useState, useEffect } from 'react';

export default function WorkspaceModal({ onCreate, onClose }) {
  const [workspaceName, setWorkspaceName] = useState('');
  const [envName, setEnvName] = useState('');
  const [serverName, setServerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    const ws = workspaceName.trim();
    const env = envName.trim();
    const srv = serverName.trim();

    if (!ws || !env || !srv) return;

    setIsLoading(true);
    try {
      // onCreate now expects (workspaceName, envName, serverName)
      await onCreate(ws, env, srv);
      onClose();
    } catch (e) {
      alert('Failed to create workspace: ' + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceName, envName, serverName]);

  const canCreate =
    workspaceName.trim().length > 0 &&
    envName.trim().length > 0 &&
    serverName.trim().length > 0 &&
    !isLoading;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start md:items-center justify-center bg-slate-900/40 backdrop-blur-sm
                 px-4 py-4 md:py-0 overflow-y-auto"
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200
                   overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)]
                   dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
      >
        {/* Header */}
        <div
          className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-slate-200 flex items-center justify-between gap-3 sm:gap-4
                     dark:border-slate-700 dark:bg-slate-900"
        >
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
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
                First‑time setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create your first workspace, environment, and server to begin comparing
                configurations.
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
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 bg-slate-50 dark:bg-slate-900 flex-1 overflow-y-auto">
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              A <span className="font-semibold">workspace</span> groups environments and servers
              for a project or release. Each server keeps its own comparison history, Excel
              path, and review session.
            </p>
            <p>
              Start by creating:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
              <li>A workspace name (project/release identifier)</li>
              <li>The first environment (e.g., LAB, SIT, UAT, PROD)</li>
              <li>The first server under that environment (e.g., server1)</li>
            </ul>
          </div>

          {/* Form */}
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Workspace name
              </label>
              <input
                type="text"
                autoFocus
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g., CoreBanking-UAT, Billing-Release-2025Q1"
                className="w-full px-4 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                           dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Environment name
                </label>
                <input
                  type="text"
                  value={envName}
                  onChange={(e) => setEnvName(e.target.value)}
                  placeholder="e.g., UAT, SIT, PROD"
                  className="w-full px-4 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                             dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Server name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g., server1"
                  className="w-full px-4 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400
                             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                             dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-xs md:text-sm font-medium text-slate-700 px-3 py-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/60
                         dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
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
                  <span>Create &amp; start</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 sm:px-6 md:px-8 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500
                     dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
        >
          <span>Tip: You can add more environments and servers later from the sidebar.</span>
          <span className="hidden sm:inline whitespace-nowrap">
            Release Notes Automation Tool
          </span>
        </div>
      </div>
    </div>
  );
}