// frontend/src/pages/ComparisonAndReviewPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import FolderTree from '../components/FolderTree';
import DiffViewer from '../components/DiffViewer';
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
      if (fs.old_path) {
        map[normalizePath(fs.old_path)] = fs;
      }
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

  // Load diff + comments when a file is selected
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
  // Resolve promise when selectedFile matches expected
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

    // Only in OLD (missing in NEW)
    if (file.summary === 'Missing in NEW' || file.missing_side === 'NEW') {
      try {
        const response = await compareFilePaths(oldPath, oldPath);
        setOldText(response.old_text || '');
      } catch (err) {
        setOldText(`Failed to read file:\n${oldPath || ''}`);
      }
      setNewText('File is missing in NEW; no content to compare.');
      setFileStatus('missing_new');
      setStatus({
        type: 'info',
        message: 'File exists only in OLD. Showing OLD content.',
      });
      return;
    }

    // Only in NEW (missing in OLD)
    if (file.summary === 'Missing in OLD' || file.missing_side === 'OLD') {
      try {
        const response = await compareFilePaths(newPath, newPath);
        setNewText(response.new_text || '');
      } catch (err) {
        setNewText(`Failed to read file:\n${newPath || ''}`);
      }
      setOldText('File is missing in OLD; no original content to compare.');
      setFileStatus('added');
      setStatus({
        type: 'info',
        message: 'File exists only in NEW. Showing NEW content.',
      });
      return;
    }

    // Normal case: both sides exist
    try {
      const response = await compareFilePaths(oldPath, newPath);
      setOldText(response.old_text || '');
      setNewText(response.new_text || '');
      setFileStatus(file.has_changes ? 'modified' : 'identical');
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
          return {
            lineNumber: Number(lineNumber),
            comment: value,
            lineContent: '',
          };
        }
        return {
          lineNumber: Number(lineNumber),
          comment: value?.comment || '',
          lineContent: value?.lineContent || '',
        };
      }
    );
    setCurrentComments(arr);
  };

  const handleNewChange = (content) => {
    setNewText(content);
    if (selectedFile) {
      setEditedContent(getFileKey(selectedFile), content);
    }
  };

  const handleCommentChange = (lineNumber, comment, lineContent = '') => {
    const updatedComments = [...currentComments];
    const idx = updatedComments.findIndex(
      (c) => c.lineNumber === lineNumber
    );

    if (idx >= 0) {
      updatedComments[idx] = {
        ...updatedComments[idx],
        comment,
        lineContent,
      };
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
      setStatus({
        type: 'error',
        message: 'No comparison data available to write',
      });
      return;
    }

    const allChanges = [];

    Object.entries(comments).forEach(([fileKey, commentMap]) => {
      const file = folderResult.file_summaries?.find(
        (f) =>
          (f.new_path || f.old_path || f.file_name) === fileKey
      );
      if (!file) return;

      const componentName = getComponentName(
        file.new_path || file.old_path
      );

      Object.entries(commentMap).forEach(([lineNumber, value]) => {
        let commentText, lineContent;
        if (typeof value === 'string') {
          commentText = value;
          lineContent = '';
        } else {
          commentText = value?.comment || '';
          lineContent = value?.lineContent || '';
        }

        if (!commentText || !commentText.trim()) return;

        const changedLineValue =
          lineContent && lineContent.trim().length > 0
            ? lineContent
            : `Line ${lineNumber}`;

        allChanges.push({
          componentName,
          fileName: file.file_name,
          changedLine: String(changedLineValue),
          comment: String(commentText),
        });
      });
    });

    console.log('Excel path (raw):', excelPath);
    console.log('Excel path (clean):', cleanedExcelPath);
    console.log('Changes payload:', allChanges);

    if (allChanges.length === 0) {
      setStatus({
        type: 'info',
        message: 'No comments to write to Excel.',
      });
      return;
    }

    try {
      const res = await apiWriteChanges(cleanedExcelPath, allChanges);
      console.log('write-changes response:', res);

      if (!res.success) {
        setStatus({
          type: 'error',
          message: res.message || 'Excel write failed',
        });
      } else {
        setStatus({
          type: 'success',
          message:
            res.message ||
            `Changes written to Excel successfully. Added ${res.written_rows} row(s).`,
        });
      }
    } catch (error) {
      console.error('Error writing to Excel:', error);
      if (error.response && error.response.data) {
        console.error(
          'write-changes validation or server error:',
          error.response.data
        );
      }
      setStatus({
        type: 'error',
        message: 'Error writing to Excel',
      });
    }
  };

  const handleToggleValidation = (filePath, checked) => {
    setMissingValidations((prev) => ({
      ...prev,
      [filePath]: checked,
    }));
  };

  const waitForDiffRender = (expectedFile) =>
    new Promise((resolve) => {
      const handler = (event) => {
        const { fileName, filePath } = event.detail || {};
        if (fileName === expectedFile.file_name && filePath === expectedFile.old_path) {
          window.removeEventListener('diff-rendered', handler);
          resolve();
        }
      };
      window.addEventListener('diff-rendered', handler);
    });

  // ✅ Button 1: capture screenshot for current file (only if modified)
  const handleCaptureCurrentConfig = async () => {
    if (!diffViewerRef.current) {
      alert('Diff viewer not ready.');
      return;
    }
    await diffViewerRef.current.captureScreenshot();
  };

  // ✅ Button 2: capture for all modified config files (skip missing-only)
  const handleCaptureAllConfigs = async () => {
    if (!cleanedExcelPath) {
      setStatus({ type: 'error', message: 'Excel path not set' });
      return;
    }
    if (!folderResult || !folderResult.file_summaries) {
      setStatus({
        type: 'error',
        message: 'No comparison data available.',
      });
      return;
    }

    const allSummaries = folderResult.file_summaries;

    const configModifiedFiles = allSummaries.filter((fs) => {
      const path = (fs.new_path || fs.old_path || '').toLowerCase();
      const isConfig =
        path.includes('/configs/') || path.includes('\\configs\\');

      const isMissingOnly =
        fs.summary === 'Missing in NEW' || fs.summary === 'Missing in OLD';

      const isRealDiff = fs.has_changes && !isMissingOnly;

      return isConfig && isRealDiff;
    });

    if (configModifiedFiles.length === 0) {
      setStatus({
        type: 'info',
        message: 'No modified files found under Configs.',
      });
      return;
    }

    setCapturingAll(true);
    try {
      for (const fs of configModifiedFiles) {
        const fileObj = {
          file_name: fs.file_name,
          old_path: fs.old_path,
          new_path: fs.new_path,
          component_name: fs.component_name,
          summary: fs.summary,
          has_changes: fs.has_changes,
        };

        readyResolveRef.current = null;
        const readyPromise = new Promise((resolve) => {
          readyResolveRef.current = resolve;
        });

        setDiffReady(false);
        expectedSelectedFileRef.current = fileObj;
        selectedFilePromiseRef.current = null;
        const selectedPromise = new Promise((resolve) => {
          selectedFilePromiseRef.current = resolve;
        });
        setSelectedFile(fileObj);
        await selectedPromise; // wait for selectedFile to update

        // Ensure file diff is loaded before proceeding
        await loadFileDiff(fileObj);

        // Wait until DiffViewer is ready
        await readyPromise;

        if (diffViewerRef.current) {
          await diffViewerRef.current.captureScreenshot({ silent: true });
          await new Promise((res) => setTimeout(res, 300));
        }

      }

      setStatus({
        type: 'success',
        message:
          'Screenshots captured for all modified files under Configs.',
      });
    } catch (err) {
      console.error('Error capturing screenshots for all configs:', err);
      setStatus({
        type: 'error',
        message: 'Error capturing screenshots for all config files.',
      });
    } finally {
      setCapturingAll(false);
    }
  };

  // 🔹 Flatten global comments for "Saved comments (all files)" panel
  const flattenedComments = useMemo(() => {
    if (!folderResult) return [];

    const result = [];

    Object.entries(comments || {}).forEach(([fileKey, lineMap]) => {
      const file = folderResult.file_summaries?.find(
        (f) =>
          (f.new_path || f.old_path || f.file_name) === fileKey
      );
      const fileName = file?.file_name || fileKey;
      const componentName = file?.component_name || '';

      Object.entries(lineMap || {}).forEach(([lineNumber, value]) => {
        let commentText, lineContent;
        if (typeof value === 'string') {
          commentText = value;
          lineContent = '';
        } else {
          commentText = value?.comment || '';
          lineContent = value?.lineContent || '';
        }
        if (!commentText || !commentText.trim()) return;

        result.push({
          fileKey,
          fileName,
          componentName,
          lineNumber: Number(lineNumber),
          comment: commentText,
          lineContent,
        });
      });
    });

    result.sort(
      (a, b) =>
        a.fileName.localeCompare(b.fileName) ||
        a.lineNumber - b.lineNumber
    );

    return result;
  }, [comments, folderResult]);

  return (
    <div className="h-full px-4 pb-4">
      <div className="h-full bg-white rounded-xl shadow-md border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Comparison Results &amp; Review
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a file from the left to view differences and add
              comments.
            </p>
          </div>
          {folderResult && (
            <div className="text-xs text-slate-500 text-right">
              <div>
                Components with changes:{' '}
                <span className="font-semibold text-slate-700">
                  {folderResult.components_with_changes}
                </span>
              </div>
              <div>
                Total components:{' '}
                <span className="font-semibold text-slate-700">
                  {folderResult.total_components}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main two-column area */}
        <div className="flex-1 flex gap-4 px-4 pt-3 overflow-hidden">
          {/* LEFT: folder tree */}
          <div className="flex flex-col w-[450px] min-w-[400px] max-w-[520px] bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                File structure
              </h3>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-2">
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
                <div className="h-full flex flex-col items-center justify-center text-center text-sm text-slate-500">
                  <p>No comparison results available.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Run a folder comparison to see files here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: diff + screenshot buttons + comments */}
          <div className="flex flex-col flex-1 rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {selectedFile
                    ? `Diff: ${selectedFile.file_name}`
                    : 'Diff viewer'}
                </h3>
                {selectedFile && (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {selectedFile.old_path || selectedFile.new_path}
                  </p>
                )}
              </div>

              {/* Screenshot buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCaptureCurrentConfig}
                  disabled={!selectedFile || fileStatus !== 'modified'}
                  className="px-2 py-1 text-[11px] rounded bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-300 disabled:text-slate-500"
                >
                  Capture current config
                </button>
                <button
                  type="button"
                  onClick={handleCaptureAllConfigs}
                  disabled={capturingAll}
                  className="px-2 py-1 text-[11px] rounded bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {capturingAll
                    ? 'Capturing all configs...'
                    : 'Capture all modified configs'}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-3">
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
                  filePath={
                    selectedFile.new_path || selectedFile.old_path || ''
                  }
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
                <div className="h-full flex flex-col items-center justify-center text-center text-sm text-slate-500">
                  <p>Select a file from the tree to view differences.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Saved Comments (all files) */}
        <div className="px-6 pb-4 pt-2 border-t border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Saved comments (all files)
          </h3>
          {flattenedComments.length === 0 ? (
            <div className="text-xs text-slate-400">
              No comments added yet. Click a line number in the diff to add
              and they will appear here.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-auto text-xs">
              {flattenedComments.map((c, idx) => (
                <div
                  key={`${c.fileKey}-${c.lineNumber}-${idx}`}
                  className="p-2 bg-white border rounded"
                >
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span className="font-semibold">
                      {c.fileName}
                      {c.componentName
                        ? `  (${c.componentName})`
                        : ''}
                    </span>
                    <span>Line {c.lineNumber}</span>
                  </div>
                  {c.lineContent && (
                    <div className="mb-1 font-mono text-[11px] whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded px-1 py-0.5">
                      {c.lineContent}
                    </div>
                  )}
                  <div className="text-[12px] text-slate-800">
                    Comment: {c.comment}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {selectedFile && (
          <div className="px-6 py-3 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
            <button
              onClick={handleSaveEditedFile}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm"
            >
              Save Edited File
            </button>
            <button
              onClick={handleWriteChangesToExcel}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow-sm"
            >
              Write Changes to Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}