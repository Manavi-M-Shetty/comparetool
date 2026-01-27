// frontend/src/pages/UploadPage.jsx
import React, { useState, useEffect } from 'react';
import { useComparison } from '../context/ComparisonContext';
import CompareButton from '../components/CompareButton';
import { browseSystemFolder, browseSystemFile } from '../utils/api'; // <--- IMPORT BOTH

export default function UploadPage() {
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

  useEffect(() => {
    setLocalOld(oldFolder || '');
  }, [oldFolder]);

  useEffect(() => {
    setLocalNew(newFolder || '');
  }, [newFolder]);

  useEffect(() => {
    setLocalExcel(excelPath || '');
  }, [excelPath]);

  // ✅ Handle "Browse Folder"
  const handleBrowseFolder = async (setter) => {
    setIsBrowsing(true);
    const path = await browseSystemFolder();
    if (path) setter(path);
    setIsBrowsing(false);
  };

  // ✅ Handle "Browse File" (Excel)
  const handleBrowseFile = async (setter) => {
    setIsBrowsing(true);
    const path = await browseSystemFile();
    if (path) setter(path);
    setIsBrowsing(false);
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

    try {
      await runFolderCompare(localOld, localNew);
    } catch (e) {
      // error status is set in context
    }
  };

  const handleExcelChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.trim().replace(/^["']|["']$/g, '');
    setLocalExcel(cleaned);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300 mb-6">
          Upload / Scan Configuration
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* OLD FOLDER */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-purple-200 ml-1">OLD folder</label>
            <div className="relative">
                <input
                    type="text"
                    value={localOld}
                    onChange={(e) => setLocalOld(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-gray-200 pl-4 pr-10 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600 shadow-inner font-mono"
                    placeholder="C:\path\to\old"
                />
                <button 
                    onClick={() => handleBrowseFolder(setLocalOld)}
                    disabled={isBrowsing}
                    className="absolute right-2 top-2 p-1.5 rounded bg-white/10 hover:bg-purple-600 text-gray-300 hover:text-white transition-colors"
                    title="Browse Folder"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                </button>
            </div>
          </div>

          {/* NEW FOLDER */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-purple-200 ml-1">NEW folder</label>
            <div className="relative">
                <input
                    type="text"
                    value={localNew}
                    onChange={(e) => setLocalNew(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-gray-200 pl-4 pr-10 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600 shadow-inner font-mono"
                    placeholder="C:\path\to\new"
                />
                <button 
                    onClick={() => handleBrowseFolder(setLocalNew)}
                    disabled={isBrowsing}
                    className="absolute right-2 top-2 p-1.5 rounded bg-white/10 hover:bg-purple-600 text-gray-300 hover:text-white transition-colors"
                    title="Browse Folder"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                </button>
            </div>
          </div>

          {/* EXCEL PATH (With Browse Button) */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-purple-200 ml-1">Excel path (optional)</label>
            <div className="flex flex-col md:flex-row gap-4">
              
              <div className="relative flex-1">
                  <input
                    type="text"
                    value={localExcel}
                    onChange={handleExcelChange}
                    className="w-full bg-black/40 border border-white/10 text-gray-200 pl-4 pr-10 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600 shadow-inner font-mono"
                    placeholder="C:\path\to\workbook.xlsx"
                  />
                  <button 
                      onClick={() => handleBrowseFile(setLocalExcel)}
                      disabled={isBrowsing}
                      className="absolute right-2 top-2 p-1.5 rounded bg-white/10 hover:bg-purple-600 text-gray-300 hover:text-white transition-colors"
                      title="Browse Excel File"
                  >
                      {/* Document Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                  </button>
              </div>

              <div className="md:w-auto w-full">
                <CompareButton onClick={handleCompare} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}