// frontend/src/pages/UploadPage.jsx
/**
 * Upload and configuration page for initiating folder comparison.
 * 
 * Features:
 * - Browse and select old/new configuration folders
 * - Browse and select Excel workbook for results
 * - Environment and server selection
 * - Folder path validation
 * - Initiate comparison and navigate to results page
 * - Status messages and error handling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComparison } from '../context/ComparisonContext';
import CompareButton from '../components/CompareButton';
import { browseSystemFolder, browseSystemFile } from '../utils/api';

export default function UploadPage() {
  const navigate = useNavigate();

  const {
    oldFolder,
    newFolder,
    excelPath,
    setOldFolder,
    setNewFolder,
    setExcelPath,
    runFolderCompare,
    status,
    setStatus,
    currentWorkspace,
  } = useComparison();

  const [localOld, setLocalOld] = useState(oldFolder || '');
  const [localNew, setLocalNew] = useState(newFolder || '');
  const [localExcel, setLocalExcel] = useState(excelPath || '');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState('');
  const [selectedServer, setSelectedServer] = useState('');

  useEffect(() => {
    if (!currentWorkspace) {
      setSelectedEnv('');
      setSelectedServer('');
      return;
    }

    const envs = currentWorkspace.environments || [];
    if (!envs.length) {
      setSelectedEnv('');
      setSelectedServer('');
      return;
    }

    const firstEnv = envs[0];
    setSelectedEnv(firstEnv.name || '');

    const servers = firstEnv.servers || [];
    setSelectedServer(servers[0]?.name || '');
  }, [currentWorkspace]);

  useEffect(() => {
    setLocalOld(oldFolder || '');
  }, [oldFolder]);

  useEffect(() => {
    setLocalNew(newFolder || '');
  }, [newFolder]);

  useEffect(() => {
    setLocalExcel(excelPath || '');
  }, [excelPath]);

  const handleBrowseFolder = async (setter) => {
    setIsBrowsing(true);
    try {
      const path = await browseSystemFolder();
      if (path) setter(path);
    } catch (e) {
      console.error('Browse folder error:', e);
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleBrowseFile = async (setter) => {
    setIsBrowsing(true);
    try {
      const path = await browseSystemFile();
      if (path) setter(path);
    } catch (e) {
      console.error('Browse file error:', e);
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleCompare = async () => {
    if (!localOld || !localNew) {
      setStatus({
        type: 'error',
        message: 'Please provide both OLD and NEW folder paths',
      });
      return;
    }

    setOldFolder(localOld);
    setNewFolder(localNew);
    setExcelPath(localExcel);
    setIsComparing(true);

    try {
      await runFolderCompare(localOld, localNew);

      setStatus({
        type: 'success',
        message: 'Comparison completed successfully! Redirecting to results...',
      });

      setTimeout(() => {
        navigate('/results');
      }, 1000);
    } catch (e) {
      console.error('Comparison failed:', e);
    } finally {
      setIsComparing(false);
    }
  };

  const handleExcelChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.trim().replace(/^["']|["']$/g, '');
    setLocalExcel(cleaned);
  };

  // Reusable Input Field Component (restyled, flat)
  const FolderInput = ({
    label,
    value,
    onChange,
    onBrowse,
    placeholder,
    icon,
    description,
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-md bg-purple-100 text-purple-700">
          {icon}
        </div>
        <div className="leading-tight">
          <label className="text-sm font-medium text-slate-900 block">
            {label}
          </label>
          {description && (
            <span className="text-xs text-slate-500">{description}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={onChange}
          disabled={isComparing}
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onBrowse}
          disabled={isBrowsing || isComparing}
          className="inline-flex items-center justify-center rounded-md bg-purple-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
          title="Browse"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
        </button>
      </div>

      {value && (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Path configured</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-full px-4 py-4 md:px-6 md:py-6 bg-slate-100">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          Configuration setup
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-xl">
          Select your source folders and Excel file to begin the
          comparison analysis.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 md:p-6">
        {/* Folder Inputs Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* OLD Folder */}
          <FolderInput
            label="OLD folder"
            description="Original / baseline configuration"
            value={localOld}
            onChange={(e) => setLocalOld(e.target.value)}
            onBrowse={() => handleBrowseFolder(setLocalOld)}
            placeholder="C:\path\to\old\folder"
            icon={
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            }
          />

          {/* NEW Folder */}
          <FolderInput
            label="NEW folder"
            description="Updated / new configuration"
            value={localNew}
            onChange={(e) => setLocalNew(e.target.value)}
            onBrowse={() => handleBrowseFolder(setLocalNew)}
            placeholder="C:\path\to\new\folder"
            icon={
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
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
            }
          />
        </div>

        {/* Excel Input - Full Width */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-emerald-100 text-emerald-700">
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
            </div>
            <div className="leading-tight flex-1">
              <label className="text-sm font-medium text-slate-900 block">
                Excel report path
              </label>
              <span className="text-xs text-slate-500">
                Export comparison results to an Excel file.
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={localExcel}
              onChange={handleExcelChange}
              disabled={isComparing}
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              placeholder="C:\path\to\report.xlsx"
            />
            <button
              type="button"
              onClick={() => handleBrowseFile(setLocalExcel)}
              disabled={isBrowsing || isComparing}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Browse Excel file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
            </button>
          </div>

          {localExcel && (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Excel export configured</span>
            </div>
          )}
        </div>

        {/* Divider + status */}
        <div className="border-t border-slate-200 pt-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {isComparing ? (
              <>
                <svg
                  className="w-4 h-4 text-purple-500 animate-spin"
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
                <span>Comparing files...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 text-purple-500"
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
                <span>Ready to compare</span>
              </>
            )}
          </div>
        </div>

        {/* Compare Button + small status indicators */}
        <div className="flex flex-col items-center gap-3">
          <CompareButton
            onClick={handleCompare}
            loading={isComparing}
            disabled={!localOld || !localNew}
          />

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${localOld ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
              />
              <span>Old folder</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${localNew ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
              />
              <span>New folder</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${localExcel ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
              />
              <span>Excel</span>
            </div>
          </div>

          {isComparing && (
            <div className="flex items-center gap-2 text-xs text-purple-600">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>You’ll be redirected to results after completion.</span>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          <svg
            className="w-4 h-4 text-purple-500"
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
          <span>Tip: You can paste paths directly or use the browse buttons.</span>
        </div>
      </div>
    </div>
  );
}