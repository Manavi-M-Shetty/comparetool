import React, { useState } from 'react';
import { scanDeltaGroups, browseSystemFolder, browseSystemFile } from '../utils/api';

export default function DeltaExplorerPage() {
  const [rootFolder, setRootFolder] = useState('');
  const [excelPath, setExcelPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: 'info', message: 'Select a database folder to begin.' });

  const handleBrowseRoot = async () => {
    const path = await browseSystemFolder();
    if (path) setRootFolder(path);
  };

  const handleBrowseExcel = async () => {
    const path = await browseSystemFile();
    if (path) setExcelPath(path);
  };

  const handleScan = async () => {
    if (!rootFolder) {
      setStatus({ type: 'error', message: 'Please select the DatabaseName folder first.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Scanning DeltaDrop structure...' });
    try {
      const data = await scanDeltaGroups(rootFolder, excelPath);
      setResult(data);
      setStatus({
        type: data.excel_written ? 'success' : 'info',
        message: data.message || 'Scan completed.',
      });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Error while scanning delta groups.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const hasGroups = result && result.groups && result.groups.length > 0;
  const databaseName = result?.database_name || '';

  return (
    <div className="min-h-full px-4 py-4 md:px-6 md:py-6 bg-slate-100">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Database Delta Explorer
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Scan a database folder containing a <span className="font-mono">DeltaDrop</span> tree
            and generate an Excel matrix: Database name, Delta folders, and their SQL files.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 md:p-6 space-y-6">
        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Database root folder */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h8M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v3m-4 4h4m-2-2v4"
                  />
                </svg>
              </span>
              <span>Database root folder</span>
            </label>
            <p className="text-xs text-slate-500">
              Select the <span className="font-mono">DatabaseName</span> folder (the one that contains{' '}
              <span className="font-mono">BaseDrop</span> and <span className="font-mono">DeltaDrop</span>).
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={rootFolder}
                onChange={(e) => setRootFolder(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="C:\path\to\DatabaseName"
              />
              <button
                type="button"
                onClick={handleBrowseRoot}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Excel path */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-emerald-100 text-emerald-700">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </span>
              <span>Excel file</span>
            </label>
            <p className="text-xs text-slate-500">
              If provided, the tool will create a sheet named after the database and fill the matrix layout.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={excelPath}
                onChange={(e) => setExcelPath(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="C:\path\to\report.xlsx"
              />
              <button
                type="button"
                onClick={handleBrowseExcel}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Browse
              </button>
            </div>
          </div>
        </div>

        {/* Actions & status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={handleScan}
              disabled={!rootFolder || loading}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
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
                  Scanning...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Scan & Write
                </>
              )}
            </button>
          </div>
          <div
            className={`text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-2 ${
              status.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status.type === 'error'
                  ? 'bg-red-500'
                  : status.type === 'success'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            />
            <span>{status.message}</span>
          </div>
        </div>

        {/* Results preview */}
        <div className="mt-4">
          {!hasGroups ? (
            <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
              No delta groups to display yet. Run a scan to preview the folder structure.
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  Database:
                </h2>
                <span className="text-sm font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {databaseName}
                </span>
                {result?.excel_written && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Written to Excel
                  </span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {result.groups.map((group) => (
                  <div
                    key={group.name}
                    className="border border-slate-200 rounded-lg bg-slate-50/60"
                  >
                    <div className="px-3 py-2 border-b border-slate-200 bg-white rounded-t-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100 text-indigo-700">
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
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {group.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {group.files.length} file(s)
                      </span>
                    </div>
                    <div className="max-h-56 overflow-auto p-2 text-xs text-slate-700 scrollbar-thin">
                      {group.files.map((f) => (
                        <div
                          key={f.full_path}
                          className="px-2 py-1 rounded-md hover:bg-white/70 flex items-center gap-2"
                          title={f.full_path}
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span className="truncate flex-1">{f.file_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Help tip */}
      <div className="mt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          <svg
            className="w-4 h-4 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Folder structure expected: <span className="font-mono">DatabaseName\DeltaDrop\*</span>,
            SQL files inside each subfolder.
          </span>
        </div>
      </div>
    </div>
  );
}