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

// Status Badge Component
function StatusBadge({ status }) {
  const config = {
    modified: {
      label: 'Modified',
      className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    identical: {
      label: 'Identical',
      className: 'bg-green-500/20 text-green-300 border-green-500/30',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    added: {
      label: 'New File',
      className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    missing_new: {
      label: 'Deleted',
      className: 'bg-red-500/20 text-red-300 border-red-500/30',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    },
  };

  const { label, className, icon } = config[status] || {
    label: status || 'Unknown',
    className: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    icon: null
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// Action Button Component
function ActionButton({ onClick, disabled, variant = 'default', children, icon, loading }) {
  const variants = {
    default: 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50',
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-purple-500/30 shadow-lg shadow-purple-900/20',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border-emerald-500/30 shadow-lg shadow-emerald-900/20',
    info: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white border-sky-500/30 shadow-lg shadow-sky-900/20',
    warning: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-amber-500/30 shadow-lg shadow-amber-900/20',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg
        border transition-all duration-200 transform
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        hover:-translate-y-0.5 active:translate-y-0
        ${variants[variant]}
      `}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}

// Stats Card Component
function StatsCard({ icon, label, value, color = 'purple' }) {
  const colors = {
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/20 text-purple-300',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/20 text-green-300',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/20 text-amber-300',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${colors[color]} border backdrop-blur-sm`}>
      <div className="p-1.5 rounded-lg bg-white/10">
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{label}</div>
        <div className="text-sm font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      return { ...f, ...meta, file_name: meta.file_name || f.file_name || f.name };
    });
    const enrichedSubfolders = (node.subfolders || []).map((sub) => enrichTree(sub));
    return { ...node, files: enrichedFiles, subfolders: enrichedSubfolders };
  };

  const enrichedTree = useMemo(
    () => (folderResult ? enrichTree(folderResult.folder_tree) : null),
    [folderResult, fileSummaryMap]
  );

  const getFileKey = (file) => file?.new_path || file?.old_path || file?.file_name;

  useEffect(() => {
    if (!selectedFile) {
      setOldText('');
      setNewText('');
      setCurrentComments([]);
      return;
    }
    loadFileDiff(selectedFile);
    loadCommentsForFile(selectedFile);
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

    try {
      const response = await compareFilePaths(oldPath, newPath);
      const oText = response.old_text || '';
      const nText = response.new_text || '';

      setOldText(oText);
      setNewText(nText);

      const normalizedOld = oText.replace(/\r\n/g, '\n').trim();
      const normalizedNew = nText.replace(/\r\n/g, '\n').trim();

      if (normalizedOld === normalizedNew) {
        setFileStatus('identical');
        if (file.has_changes) {
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
    const arr = Object.entries(fileCommentsObj).map(([lineNumber, value]) => {
      if (typeof value === 'string') {
        return { lineNumber: Number(lineNumber), comment: value, lineContent: '' };
      }
      return { lineNumber: Number(lineNumber), comment: value?.comment || '', lineContent: value?.lineContent || '' };
    });
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

  const handleCaptureCurrentConfig = async () => {
    if (!diffViewerRef.current) {
      alert('Diff viewer not ready.');
      return;
    }

    setCaptureProgress({
      isVisible: true,
      currentFile: selectedFile?.file_name || 'Current View',
      progress: 30,
      total: 1,
      current: 1
    });

    try {
      await new Promise(r => setTimeout(r, 600));
      await diffViewerRef.current.captureScreenshot({ silent: true });
      setCaptureProgress(prev => ({ ...prev, progress: 100 }));
      setStatus({ type: 'success', message: 'Screenshot added to Excel successfully.' });
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      console.error(e);
      const msg = e?.message || 'Failed to capture screenshot.';
      setStatus({ type: 'error', message: msg });
      // optional: also pop an alert
      // alert(msg);
    }
    finally {
      setCaptureProgress({ isVisible: false, currentFile: '', progress: 0, total: 0, current: 0 });
    }
  };

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

        // existing selection / diff loading logic
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
          try {
            await diffViewerRef.current.captureScreenshot({ silent: true });
            await new Promise((res) => setTimeout(res, 500));
          } catch (err) {
            console.error('Error capturing screenshot for', fs.file_name, err);
            // Stop the loop and let outer catch handle the message
            throw err;
          }
        }
      }

      setCaptureProgress(prev => ({ ...prev, progress: 100 }));
      setStatus({ type: 'success', message: 'Screenshots captured for all modified files under Configs.' });
      await new Promise((res) => setTimeout(res, 1500));
    } catch (err) {
      console.error('Error capturing screenshots for all configs:', err);
      const msg = err?.message || 'Error capturing screenshots for all config files.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setCapturingAll(false);
      setCaptureProgress({ isVisible: false, currentFile: '', progress: 0, total: 0, current: 0 });
    }
  };

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

  const modifiedFilesCount = useMemo(() => {
    return folderResult?.file_summaries?.filter(f => f.has_changes).length || 0;
  }, [folderResult]);

  return (
    <>
      <ProcessingOverlay
        isVisible={captureProgress.isVisible}
        currentFile={captureProgress.currentFile}
        progress={captureProgress.progress}
        total={captureProgress.total}
        current={captureProgress.current}
      />

      <div className="h-full w-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900">
        {/* Ambient Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative z-10 shrink-0">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="px-6 py-4 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center justify-between">
              {/* Left: Title & Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Comparison Results</h1>
                    <p className="text-xs text-gray-500">
                      {folderResult ? 'Analysis complete' : 'Run a comparison to see results'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                {folderResult && (
                  <div className="hidden lg:flex items-center gap-3">
                    <StatsCard
                      icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
                      label="Components"
                      value={folderResult.total_components || 0}
                      color="purple"
                    />
                    <StatsCard
                      icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                      label="Modified"
                      value={modifiedFilesCount}
                      color="amber"
                    />
                    <StatsCard
                      icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
                      label="Comments"
                      value={flattenedComments.length}
                      color="green"
                    />
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={handleCaptureCurrentConfig}
                  disabled={!selectedFile || fileStatus !== 'modified'}
                  variant="info"
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                >
                  Capture View
                </ActionButton>

                <ActionButton
                  onClick={handleCaptureAllConfigs}
                  disabled={capturingAll}
                  loading={capturingAll}
                  variant="primary"
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                >
                  {capturingAll ? 'Capturing...' : 'Capture All'}
                </ActionButton>

                <div className="h-6 w-px bg-gray-700 mx-1" />

                <ActionButton
                  onClick={handleSaveEditedFile}
                  disabled={!selectedFile}
                  variant="success"
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
                >
                  Save File
                </ActionButton>

                <ActionButton
                  onClick={handleWriteChangesToExcel}
                  variant="warning"
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                >
                  Write to Excel
                </ActionButton>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative z-0">
          {/* Left Sidebar: File Explorer */}
          <div className={`
            flex flex-col border-r border-white/5 bg-slate-900/40 backdrop-blur-sm
            transition-all duration-300
            ${sidebarCollapsed ? 'w-12' : 'w-80'}
          `}>
            {/* Sidebar Header */}
            <div className="px-3 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Explorer</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* File Tree */}
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
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
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                        <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-400">No Results Yet</p>
                      <p className="text-xs text-gray-600 mt-1">Run a comparison to see files</p>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="h-1/4 min-h-[150px] border-t border-white/5 flex flex-col bg-black/20">
                  <div className="px-3 py-2 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comments</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                      {flattenedComments.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-500/20">
                    {flattenedComments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg className="w-6 h-6 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-xs text-gray-600 italic">No comments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {flattenedComments.map((c, idx) => (
                          <div
                            key={`${c.fileKey}-${c.lineNumber}-${idx}`}
                            className="group p-2.5 bg-gradient-to-r from-white/5 to-transparent rounded-lg border border-white/5 hover:border-purple-500/30 hover:bg-white/10 cursor-pointer transition-all duration-200"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-purple-300 font-medium truncate max-w-[120px]">{c.fileName}</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono">Ln {c.lineNumber}</span>
                            </div>
                            <p className="text-[11px] text-gray-300 truncate group-hover:text-white transition-colors">{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Diff Viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-950/50">
            {/* File Header */}
            <div className="h-14 border-b border-white/5 px-4 flex items-center justify-between bg-black/20 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                {selectedFile ? (
                  <>
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{selectedFile.file_name}</p>
                      <p className="text-[10px] text-gray-500 font-mono truncate max-w-md">{selectedFile.old_path || selectedFile.new_path}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">No file selected</span>
                )}
              </div>

              {selectedFile && fileStatus && (
                <StatusBadge status={fileStatus} />
              )}
            </div>

            {/* Diff Content */}
            <div className="flex-1 overflow-hidden relative">
              {selectedFile ? (
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
                  onReady={() => {
                    setDiffReady(true);
                    if (readyResolveRef.current) {
                      readyResolveRef.current();
                      readyResolveRef.current = null;
                    }
                  }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl" />
                    <div className="relative p-6 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <svg className="h-16 w-16 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No File Selected</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Select a file from the explorer to view differences and add comments
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}