// frontend/src/pages/UploadPage.jsx
import React, { useState, useEffect } from 'react';
import { useComparison } from '../context/ComparisonContext';
import CompareButton from '../components/CompareButton';

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

  // 🔹 IMPORTANT: keep local inputs in sync with context (workspace change, session restore, etc.)
  useEffect(() => {
    setLocalOld(oldFolder || '');
  }, [oldFolder]);

  useEffect(() => {
    setLocalNew(newFolder || '');
  }, [newFolder]);

  useEffect(() => {
    setLocalExcel(excelPath || '');
  }, [excelPath]);

  const handleCompare = async () => {
    if (!localOld || !localNew) {
      setStatus({
        type: 'error',
        message: 'Please provide both OLD and NEW folder paths',
      });
      return;
    }

    // Sync context before running compare
    setOldFolder(localOld);
    setNewFolder(localNew);
    setExcelPath(localExcel);

    try {
      await runFolderCompare(localOld, localNew);
    } catch (e) {
      // error status is set in context
    }
  };

  // Optionally: clean quotes immediately when user types Excel path
  const handleExcelChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.trim().replace(/^["']|["']$/g, '');
    setLocalExcel(cleaned);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold">Upload / Scan</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-xs">OLD folder</label>
            <input
              type="text"
              value={localOld}
              onChange={(e) => setLocalOld(e.target.value)}
              className="w-full border px-2 py-1 text-xs"
              placeholder="C:\\path\\to\\old"
            />
          </div>
          <div>
            <label className="text-xs">NEW folder</label>
            <input
              type="text"
              value={localNew}
              onChange={(e) => setLocalNew(e.target.value)}
              className="w-full border px-2 py-1 text-xs"
              placeholder="C:\\path\\to\\new"
            />
          </div>
          <div>
            <label className="text-xs">Excel path (optional)</label>
            <input
              type="text"
              value={localExcel}
              onChange={handleExcelChange}
              className="w-full border px-2 py-1 text-xs"
              placeholder="C:\\path\\to\\workbook.xlsx"
            />
          </div>
          <div className="flex items-end gap-2">
            <CompareButton onClick={handleCompare} />
          </div>
        </div>
      </div>
    </div>
  );
}