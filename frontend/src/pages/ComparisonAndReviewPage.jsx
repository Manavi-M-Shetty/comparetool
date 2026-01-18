// frontend/src/pages/ComparisonAndReviewPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

  const normalizePath = (p) => (p || '').replace(/\\/g, '/');

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

  const loadFileDiff = async (file) => {
    const oldPath = file.old_path;
    const newPath = file.new_path;

    if (file.summary === 'Missing in NEW' || !newPath) {
      setOldText(`File exists only in OLD:\n${oldPath || ''}`);
      setNewText('File is missing in NEW; no content to compare.');
      setFileStatus('missing_new');
      setStatus({
        type: 'info',
        message: 'File missing in NEW; showing only OLD content path.',
      });
      return;
    }

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
      ([lineNumber, comment]) => ({
        lineNumber: Number(lineNumber),
        comment,
      })
    );
    setCurrentComments(arr);
  };

  const handleNewChange = (content) => {
    setNewText(content);
    if (selectedFile) {
      setEditedContent(getFileKey(selectedFile), content);
    }
  };

  const handleCommentChange = (lineNumber, comment) => {
    const updatedComments = [...currentComments];
    const idx = updatedComments.findIndex(
      (c) => c.lineNumber === lineNumber
    );

    if (idx >= 0) {
      updatedComments[idx].comment = comment;
    } else {
      updatedComments.push({ lineNumber, comment });
    }

    setCurrentComments(updatedComments);

    const fileKey = getFileKey(selectedFile);
    setComment(fileKey, lineNumber, comment);
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

 // frontend/src/pages/ComparisonAndReviewPage.jsx
const handleWriteChangesToExcel = async () => {
  if (!excelPath) {
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

  // 🔹 Strip quotes if user pasted: "D:\intern task\Book1.xlsx"
  const cleanExcelPath = excelPath.trim().replace(/^["']|["']$/g, '');

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

    Object.entries(commentMap).forEach(([lineNumber, comment]) => {
      if (!comment) return;
      allChanges.push({
        componentName,
        fileName: file.file_name,
        changedLine: String(lineNumber),
        comment: String(comment),
      });
    });
  });

  console.log('Excel path (raw):', excelPath);
  console.log('Excel path (clean):', cleanExcelPath);
  console.log('Changes payload:', allChanges);

  if (allChanges.length === 0) {
    setStatus({
      type: 'info',
      message: 'No comments to write to Excel.',
    });
    return;
  }

  try {
    const res = await apiWriteChanges(cleanExcelPath, allChanges);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)]">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 h-full flex flex-col">
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
        <div className="flex-1 grid grid-cols-[minmax(260px,320px)_minmax(0,1fr)] gap-4 p-4 overflow-hidden">
          {/* Left: Folder Tree panel */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 flex flex-col overflow-hidden">
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

          {/* Right: Diff + comments panel */}
          <div className="rounded-lg border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">
                {selectedFile
                  ? `Diff: ${selectedFile.file_name}`
                  : 'Diff viewer'}
              </h3>
              {selectedFile && (
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {selectedFile.old_path}
                </p>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-3">
              {selectedFile ? (
                <DiffViewer
                  oldText={oldText}
                  newText={newText}
                  status={fileStatus}
                  onNewChange={handleNewChange}
                  comments={currentComments}
                  onCommentChange={handleCommentChange}
                  fileName={selectedFile.file_name}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-sm text-slate-500">
                  <p>Select a file from the tree to view differences.</p>
                </div>
              )}
            </div>
          </div>
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