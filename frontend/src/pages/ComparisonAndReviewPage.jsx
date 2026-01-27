// frontend/src/pages/ComparisonAndReviewPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import FolderTree from '../components/FolderTree';
import DiffViewer from '../components/DiffViewer';
import ProcessingOverlay from '../components/ProcessingOverlay';
import { useComparison } from '../context/ComparisonContext';
import {
  compareFilePaths,
  saveEditedFile as apiSaveEditedFile,
  writeChanges as apiWriteChanges,
} from '../utils/api';
import { getComponentName } from '../utils/fileUtils';

export default function ComparisonAndReviewPage() {
  const {
    folderResult,
    setFolderResult, 
    selectedFile,
    setSelectedFile,
    missingValidations,
    setMissingValidations,
    comments,
    setComment,
    setEditedContent,
    setStatus,
    excelPath,
  } = useComparison();

  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [fileStatus, setFileStatus] = useState('');
  const [currentComments, setCurrentComments] = useState([]);
  const [diffReady, setDiffReady] = useState(false);
  const [capturingAll, setCapturingAll] = useState(false);

  // Animation Overlay State
  const [captureProgress, setCaptureProgress] = useState({ 
    isVisible: false, 
    currentFile: '', 
    progress: 0, 
    total: 0, 
    current: 0 
  });

  const diffViewerRef = useRef(null);
  const readyResolveRef = useRef(null);
  const selectedFilePromiseRef = useRef(null);
  const expectedSelectedFileRef = useRef(null);

  const normalizePath = (p) => (p || '').replace(/\\/g, '/');

  const cleanedExcelPath = useMemo(
    () => (excelPath || '').trim().replace(/^["']|["']$/g, ''),
    [excelPath]
  );

  // Map old_path -> summary metadata
  const fileSummaryMap = useMemo(() => {
    const map = {};
    (folderResult?.file_summaries || []).forEach((fs) => {
      if (fs.old_path) map[normalizePath(fs.old_path)] = fs;
      if (fs.new_path) map[normalizePath(fs.new_path)] = fs;
    });
    return map;
  }, [folderResult]);

  const enrichTree = (node) => {
    if (!node) return null;
    const enrichedFiles = (node.files || []).map((f) => {
      const key = normalizePath(f.path);
      const meta = fileSummaryMap[key] || {};
      return {
        ...f,
        ...meta,
        file_name: meta.file_name || f.file_name || f.name,
      };
    });
    const enrichedSubfolders = (node.subfolders || []).map((sub) =>
      enrichTree(sub)
    );
    return {
      ...node,
      files: enrichedFiles,
      subfolders: enrichedSubfolders,
    };
  };

  const enrichedTree = useMemo(
    () => (folderResult ? enrichTree(folderResult.folder_tree) : null),
    [folderResult, fileSummaryMap]
  );

  const getFileKey = (file) =>
    file?.new_path || file?.old_path || file?.file_name;

  useEffect(() => {
    if (!selectedFile) {
      setOldText('');
      setNewText('');
      setCurrentComments([]);
      return;
    }
    loadFileDiff(selectedFile);
    loadCommentsForFile(selectedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, comments]);

  useEffect(() => {
    if (expectedSelectedFileRef.current && selectedFile && getFileKey(selectedFile) === getFileKey(expectedSelectedFileRef.current)) {
      if (selectedFilePromiseRef.current) {
        selectedFilePromiseRef.current();
        selectedFilePromiseRef.current = null;
      }
      expectedSelectedFileRef.current = null;
    }
  }, [selectedFile]);

  const loadFileDiff = async (file) => {
    const oldPath = file.old_path;
    const newPath = file.new_path;

    // 1. Missing in NEW
    if (file.summary === 'Missing in NEW' || file.missing_side === 'NEW') {
      try {
        const response = await compareFilePaths(oldPath, oldPath);
        setOldText(response.old_text || '');
      } catch (err) {
        setOldText(`Failed to read file:\n${oldPath || ''}`);
      }
      setNewText('File is missing in NEW; no content to compare.');
      setFileStatus('missing_new');
      setStatus({ type: 'info', message: 'File exists only in OLD. Showing OLD content.' });
      return;
    }

    // 2. Missing in OLD
    if (file.summary === 'Missing in OLD' || file.missing_side === 'OLD') {
      try {
        const response = await compareFilePaths(newPath, newPath);
        setNewText(response.new_text || '');
      } catch (err) {
        setNewText(`Failed to read file:\n${newPath || ''}`);
      }
      setOldText('File is missing in OLD; no original content to compare.');
      setFileStatus('added');
      setStatus({ type: 'info', message: 'File exists only in NEW. Showing NEW content.' });
      return;
    }

    // 3. Normal Compare
    try {
      const response = await compareFilePaths(oldPath, newPath);
      const oText = response.old_text || '';
      const nText = response.new_text || '';
      
      setOldText(oText);
      setNewText(nText);

      // 🔹 FIX: Normalize text to ignore CRLF vs LF differences
      const normalizedOld = oText.replace(/\r\n/g, '\n').trim();
      const normalizedNew = nText.replace(/\r\n/g, '\n').trim();

      if (normalizedOld === normalizedNew) {
        setFileStatus('identical');

        // 🔹 UPDATE GLOBAL STATE if backend wrongly thought it was modified
        if (file.has_changes) {
            console.log('Auto-correction: Backend marked modified, but content is identical.');
            setFolderResult(prev => {
                if (!prev) return prev;
                const newSummaries = prev.file_summaries.map(fs => {
                    const isSameFile = (fs.old_path && fs.old_path === oldPath) || (fs.new_path && fs.new_path === newPath);
                    if (isSameFile) return { ...fs, has_changes: false };
                    return fs;
                });
                return { ...prev, file_summaries: newSummaries };
            });
        }
      } else {
        setFileStatus(file.has_changes ? 'modified' : 'identical');
      }

    } catch (error) {
      console.error('Error loading diff:', error);
      setStatus({ type: 'error', message: 'Error loading file diff' });
    }
  };

  const loadCommentsForFile = (file) => {
    const fileKey = getFileKey(file);
    const fileCommentsObj = comments[fileKey] || {};
    const arr = Object.entries(fileCommentsObj).map(
      ([lineNumber, value]) => {
        if (typeof value === 'string') {
          return { lineNumber: Number(lineNumber), comment: value, lineContent: '' };
        }
        return { lineNumber: Number(lineNumber), comment: value?.comment || '', lineContent: value?.lineContent || '' };
      }
    );
    setCurrentComments(arr);
  };

  const handleNewChange = (content) => {
    setNewText(content);
    if (selectedFile) setEditedContent(getFileKey(selectedFile), content);
  };

  const handleCommentChange = (lineNumber, comment, lineContent = '') => {
    const updatedComments = [...currentComments];
    const idx = updatedComments.findIndex((c) => c.lineNumber === lineNumber);
    if (idx >= 0) {
      updatedComments[idx] = { ...updatedComments[idx], comment, lineContent };
    } else {
      updatedComments.push({ lineNumber, comment, lineContent });
    }
    setCurrentComments(updatedComments);
    const fileKey = getFileKey(selectedFile);
    setComment(fileKey, lineNumber, { comment, lineContent });
  };

  const handleSaveEditedFile = async () => {
    if (!selectedFile) return;
    try {
      await apiSaveEditedFile({
        file_path: selectedFile.new_path,
        updated_content: newText,
      });
      setStatus({ type: 'success', message: 'File saved successfully' });
    } catch (error) {
      console.error('Error saving file:', error);
      setStatus({ type: 'error', message: 'Error saving file' });
    }
  };

  const handleWriteChangesToExcel = async () => {
    if (!cleanedExcelPath) {
      setStatus({ type: 'error', message: 'Excel path not set' });
      return;
    }
    if (!folderResult) {
      setStatus({ type: 'error', message: 'No comparison data available to write' });
      return;
    }

    const allChanges = [];
    Object.entries(comments).forEach(([fileKey, commentMap]) => {
      const file = folderResult.file_summaries?.find(f => (f.new_path || f.old_path || f.file_name) === fileKey);
      if (!file) return;
      const componentName = getComponentName(file.new_path || file.old_path);
      Object.entries(commentMap).forEach(([lineNumber, value]) => {
        let commentText = typeof value === 'string' ? value : value?.comment || '';
        let lineContent = typeof value === 'string' ? '' : value?.lineContent || '';
        if (!commentText || !commentText.trim()) return;
        const changedLineValue = lineContent && lineContent.trim().length > 0 ? lineContent : `Line ${lineNumber}`;
        allChanges.push({
          componentName,
          fileName: file.file_name,
          changedLine: String(changedLineValue),
          comment: String(commentText),
        });
      });
    });

    if (allChanges.length === 0) {
      setStatus({ type: 'info', message: 'No comments to write to Excel.' });
      return;
    }

    try {
      const res = await apiWriteChanges(cleanedExcelPath, allChanges);
      if (!res.success) {
        setStatus({ type: 'error', message: res.message || 'Excel write failed' });
      } else {
        setStatus({ type: 'success', message: res.message || `Changes written to Excel successfully. Added ${res.written_rows} row(s).` });
      }
    } catch (error) {
      console.error('Error writing to Excel:', error);
      setStatus({ type: 'error', message: 'Error writing to Excel' });
    }
  };

  const handleToggleValidation = (filePath, checked) => {
    setMissingValidations((prev) => ({ ...prev, [filePath]: checked }));
  };

  // ✅ Button 1: CAPTURE SINGLE FILE
  const handleCaptureCurrentConfig = async () => {
    if (!diffViewerRef.current) {
      alert('Diff viewer not ready.');
      return;
    }
    
    // Trigger Overlay
    setCaptureProgress({ 
        isVisible: true, 
        currentFile: selectedFile?.file_name || 'Current View', 
        progress: 30, 
        total: 1, 
        current: 1 
    });

    try {
        await new Promise(r => setTimeout(r, 600)); // Delay for effect
        await diffViewerRef.current.captureScreenshot({ silent: true });
        
        setCaptureProgress(prev => ({ ...prev, progress: 100 }));
        setStatus({ type: 'success', message: 'Screenshot added to Excel successfully.' });
        await new Promise(r => setTimeout(r, 800));

    } catch (e) {
        console.error(e);
        setStatus({ type: 'error', message: 'Failed to capture screenshot.' });
    } finally {
        setCaptureProgress({ isVisible: false, currentFile: '', progress: 0, total: 0, current: 0 });
    }
  };

  // ✅ Button 2: CAPTURE ALL MODIFIED
  const handleCaptureAllConfigs = async () => {
    if (!cleanedExcelPath) {
      setStatus({ type: 'error', message: 'Excel path not set' });
      return;
    }
    if (!folderResult || !folderResult.file_summaries) {
      setStatus({ type: 'error', message: 'No comparison data available.' });
      return;
    }

    const allSummaries = folderResult.file_summaries;
    const configModifiedFiles = allSummaries.filter((fs) => {
      const path = (fs.new_path || fs.old_path || '').toLowerCase();
      const isConfig = path.includes('/configs/') || path.includes('\\configs\\');
      const isMissingOnly = fs.summary === 'Missing in NEW' || fs.summary === 'Missing in OLD';
      const isRealDiff = fs.has_changes && !isMissingOnly;
      return isConfig && isRealDiff;
    });

    if (configModifiedFiles.length === 0) {
      setStatus({ type: 'info', message: 'No modified files found under Configs.' });
      return;
    }

    setCapturingAll(true);
    let count = 0;
    const total = configModifiedFiles.length;
    
    setCaptureProgress({ 
        isVisible: true, 
        currentFile: 'Initializing...', 
        progress: 0, 
        total, 
        current: 0 
    });

    try {
      for (const fs of configModifiedFiles) {
        count++;
        setCaptureProgress({ 
            isVisible: true, 
            currentFile: fs.file_name, 
            progress: (count / total) * 100, 
            total, 
            current: count 
        });

        const fileObj = {
          file_name: fs.file_name,
          old_path: fs.old_path,
          new_path: fs.new_path,
          component_name: fs.component_name,
          summary: fs.summary,
          has_changes: fs.has_changes,
        };

        readyResolveRef.current = null;
        const readyPromise = new Promise((resolve) => { readyResolveRef.current = resolve; });
        setDiffReady(false);
        expectedSelectedFileRef.current = fileObj;
        selectedFilePromiseRef.current = null;
        const selectedPromise = new Promise((resolve) => { selectedFilePromiseRef.current = resolve; });
        
        setSelectedFile(fileObj);
        await selectedPromise; 
        await loadFileDiff(fileObj);
        await readyPromise;

        if (diffViewerRef.current) {
          await diffViewerRef.current.captureScreenshot({ silent: true });
          await new Promise((res) => setTimeout(res, 500));
        }
      }

      setCaptureProgress(prev => ({ ...prev, progress: 100 }));
      setStatus({ type: 'success', message: 'Screenshots captured for all modified files under Configs.' });
      await new Promise((res) => setTimeout(res, 1500));

    } catch (err) {
      console.error('Error capturing screenshots for all configs:', err);
      setStatus({ type: 'error', message: 'Error capturing screenshots for all config files.' });
    } finally {
      setCapturingAll(false);
      setCaptureProgress({ isVisible: false, currentFile: '', progress: 0, total: 0, current: 0 });
    }
  };

  // 🔹 Flatten global comments
  const flattenedComments = useMemo(() => {
    if (!folderResult) return [];
    const result = [];
    Object.entries(comments || {}).forEach(([fileKey, lineMap]) => {
      const file = folderResult.file_summaries?.find(f => (f.new_path || f.old_path || f.file_name) === fileKey);
      const fileName = file?.file_name || fileKey;
      Object.entries(lineMap || {}).forEach(([lineNumber, value]) => {
        let commentText = typeof value === 'string' ? value : value?.comment;
        if (commentText) result.push({ fileKey, fileName, lineNumber: Number(lineNumber), comment: commentText });
      });
    });
    return result;
  }, [comments, folderResult]);

  return (
    <>
    {/* Overlay */}
    <ProcessingOverlay 
        isVisible={captureProgress.isVisible} 
        currentFile={captureProgress.currentFile}
        progress={captureProgress.progress}
        total={captureProgress.total}
        current={captureProgress.current}
    />
    
    <div className="h-full w-full bg-slate-900/40 backdrop-blur-xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
          <div><h2 className="text-sm font-bold text-gray-200">Comparison: <span className="text-purple-300 font-normal">{folderResult?.total_components ? `Results Loaded` : 'No results'}</span></h2></div>
          {folderResult && (
            <div className="text-xs text-gray-400 flex gap-4">
              <div>Components with changes: <span className="text-white font-mono">{folderResult.components_with_changes}</span></div>
              <div>Total components: <span className="text-white font-mono">{folderResult.total_components}</span></div>
            </div>
          )}
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Tree */}
          <div className="w-[350px] min-w-[300px] flex flex-col border-r border-white/10 bg-black/20">
            <div className="px-3 py-2 border-b border-white/5 bg-white/5 shrink-0"><h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Explorer</h3></div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {folderResult && enrichedTree ? (
                <FolderTree
                  title="Folder Results"
                  tree={enrichedTree}
                  onFileSelect={setSelectedFile}
                  search=""
                  missingOldFiles={folderResult.old_only_files || []}
                  missingNewFiles={folderResult.new_only_files || []}
                  validationMap={missingValidations}
                  onToggleValidation={handleToggleValidation}
                />
              ) : (
                <div className="mt-10 text-center text-sm text-gray-500"><p>Run a comparison to see files.</p></div>
              )}
            </div>
            
            <div className="h-1/4 border-t border-white/10 flex flex-col bg-slate-900/50">
               <div className="px-3 py-1.5 border-b border-white/5 bg-white/5 text-[10px] font-bold text-gray-400 uppercase">Global Comments</div>
               <div className="flex-1 overflow-y-auto p-2">
                 {flattenedComments.length === 0 ? (
                    <div className="text-xs text-gray-600 italic text-center mt-2">No comments yet.</div>
                 ) : (
                    <div className="space-y-2">
                      {flattenedComments.map((c, idx) => (
                        <div key={`${c.fileKey}-${c.lineNumber}-${idx}`} className="p-2 bg-white/5 rounded border border-white/5 hover:bg-white/10 cursor-pointer">
                            <div className="flex justify-between text-[10px] text-purple-300"><span className="truncate max-w-[150px]">{c.fileName}</span><span>Ln {c.lineNumber}</span></div>
                            <div className="text-[11px] text-gray-300 truncate">{c.comment}</div>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
            </div>
          </div>

          {/* RIGHT: Viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
            <div className="h-12 border-b border-white/5 px-4 flex items-center justify-between bg-white/5 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                 <span className="text-gray-400 text-sm">File:</span>
                 <span className="text-sm font-medium text-white truncate max-w-md">{selectedFile ? selectedFile.file_name : 'No file selected'}</span>
                 {selectedFile && <span className="text-xs text-gray-500 font-mono hidden md:inline-block ml-2 opacity-60">{selectedFile.old_path || selectedFile.new_path}</span>}
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={handleCaptureCurrentConfig} disabled={!selectedFile || fileStatus !== 'modified'} className="px-2 py-1 text-xs rounded bg-sky-600/20 text-sky-300 border border-sky-600/50 hover:bg-sky-600/40 disabled:opacity-30 transition-all">Capture View</button>
                <button type="button" onClick={handleCaptureAllConfigs} disabled={capturingAll} className="px-2 py-1 text-xs rounded bg-purple-600/20 text-purple-300 border border-purple-600/50 hover:bg-purple-600/40 disabled:opacity-30 transition-all">{capturingAll ? 'Capturing...' : 'Capture All'}</button>
                <div className="h-4 w-px bg-gray-700 mx-1"></div>
                <button onClick={handleSaveEditedFile} disabled={!selectedFile} className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Save File</button>
                <button onClick={handleWriteChangesToExcel} className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shadow-lg shadow-indigo-900/20">Write to Excel</button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative p-0">
              {selectedFile ? (
                <div className="h-full flex flex-col"> 
                   <DiffViewer
                      key={getFileKey(selectedFile)}
                      ref={diffViewerRef}
                      oldText={oldText}
                      newText={newText}
                      status={fileStatus}
                      onNewChange={handleNewChange}
                      comments={currentComments}
                      onCommentChange={handleCommentChange}
                      fileName={selectedFile.file_name}
                      filePath={selectedFile.new_path || selectedFile.old_path || ''}
                      excelPath={cleanedExcelPath}
                      onReady={() => { setDiffReady(true); if (readyResolveRef.current) { readyResolveRef.current(); readyResolveRef.current = null; } }}
                    />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                  <div className="p-8 rounded-full bg-white/5 mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                  <p className="text-lg font-medium text-gray-400">Select a file to compare</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
    </>
  );
}