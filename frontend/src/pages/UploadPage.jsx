// frontend/src/pages/UploadPage.jsx
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
  } = useComparison();

  const [localOld, setLocalOld] = useState(oldFolder || '');
  const [localNew, setLocalNew] = useState(newFolder || '');
  const [localExcel, setLocalExcel] = useState(excelPath || '');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

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
      
      // ✅ Success! Show success message and redirect
      setStatus({
        type: 'success',
        message: 'Comparison completed successfully! Redirecting to results...',
      });

      // ✅ Redirect to results page after a short delay
      setTimeout(() => {
        navigate('/results');
      }, 1000);
      
    } catch (e) {
      // Error status is set in context
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

  // Reusable Input Field Component
  const FolderInput = ({ label, value, onChange, onBrowse, placeholder, icon, description }) => (
    <div className="group relative">
      {/* Glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
      
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300">
        {/* Label with icon */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            {icon}
          </div>
          <div>
            <label className="text-sm font-semibold text-purple-200 block">
              {label}
            </label>
            {description && (
              <span className="text-xs text-gray-500">{description}</span>
            )}
          </div>
        </div>
        
        {/* Input with browse button */}
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={onChange}
            disabled={isComparing}
            className="w-full bg-black/50 border border-purple-500/30 text-gray-200 pl-4 pr-12 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder-gray-600 font-mono tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={placeholder}
          />
          <button
            onClick={onBrowse}
            disabled={isBrowsing || isComparing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-gradient-to-br from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Browse"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
        
        {/* Path indicator */}
        {value && (
          <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Path configured</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto p-6 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-3">
            Configuration Setup
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Select your source folders and optional Excel file to begin the comparison analysis
          </p>
        </div>

        {/* Main Card */}
        <div className="relative">
          {/* Card glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-3xl blur-xl" />
          
          <div className="relative bg-slate-900/70 backdrop-blur-2xl border border-purple-500/20 rounded-3xl shadow-2xl shadow-purple-900/20 overflow-hidden">
            {/* Top decorative bar */}
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
            
            <div className="p-8">
              {/* Folder Inputs Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* OLD Folder */}
                <FolderInput
                  label="OLD Folder"
                  description="Select the original/baseline folder"
                  value={localOld}
                  onChange={(e) => setLocalOld(e.target.value)}
                  onBrowse={() => handleBrowseFolder(setLocalOld)}
                  placeholder="C:\path\to\old\folder"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  }
                />

                {/* NEW Folder */}
                <FolderInput
                  label="NEW Folder"
                  description="Select the updated/new folder"
                  value={localNew}
                  onChange={(e) => setLocalNew(e.target.value)}
                  onBrowse={() => handleBrowseFolder(setLocalNew)}
                  placeholder="C:\path\to\new\folder"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  }
                />
              </div>

              {/* Excel Input - Full Width */}
              <div className="group relative mb-8">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
                
                <div className="relative bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-purple-200 block">
                        Excel Report Path
                      </label>
                      <span className="text-xs text-gray-500">Optional - Export comparison results to Excel</span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                      Optional
                    </span>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={localExcel}
                      onChange={handleExcelChange}
                      disabled={isComparing}
                      className="w-full bg-black/50 border border-purple-500/30 text-gray-200 pl-4 pr-12 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder-gray-600 font-mono tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="C:\path\to\report.xlsx"
                    />
                    <button
                      onClick={() => handleBrowseFile(setLocalExcel)}
                      disabled={isBrowsing || isComparing}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-gradient-to-br from-green-600/80 to-emerald-600/80 hover:from-green-500 hover:to-emerald-500 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Browse Excel File"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  {localExcel && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Excel export configured</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900/70 text-gray-500 flex items-center gap-2">
                    {isComparing ? (
                      <>
                        <svg className="w-4 h-4 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Comparing files...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Ready to compare
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Compare Button Section */}
              <div className="flex flex-col items-center gap-4">
                <CompareButton 
                  onClick={handleCompare} 
                  loading={isComparing}
                  disabled={!localOld || !localNew}
                />
                
                {/* Status indicators */}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${localOld ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span>Old folder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${localNew ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span>New folder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${localExcel ? 'bg-green-400' : 'bg-gray-600'}`} />
                    <span>Excel</span>
                  </div>
                </div>

                {/* Redirect notice when comparing */}
                {isComparing && (
                  <div className="flex items-center gap-2 text-sm text-purple-400 animate-pulse">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>You'll be redirected to results after completion</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom decorative element */}
            <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-gray-400">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Tip: You can paste paths directly or use the browse buttons</span>
          </div>
        </div>
      </div>
    </div>
  );
}