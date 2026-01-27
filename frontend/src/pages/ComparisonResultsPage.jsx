// frontend/src/pages/ComparisonResultsPage.jsx
import React from 'react'
import FolderTree from '../components/FolderTree'
import { useComparison } from '../context/ComparisonContext'
import DiffViewer from '../components/DiffViewer'

export default function ComparisonResultsPage(){
  const { folderResult, fetchFileDiff, setSelectedFile, selectedFile, missingValidations, setMissingValidations, comments, setStatus } = useComparison();

  // Enrich folder tree files with metadata from file_summaries so statuses display correctly
  const folderTree = (() => {
    if (!folderResult || !folderResult.folder_tree) return null;
    const summaryMap = new Map((folderResult.file_summaries || []).map((fs) => [fs.old_path, fs]));

    const applyFilters = (node) => {
      const filesWithMeta = (node.files || []).map((f) => {
        const meta = summaryMap.get(f.path) || {};
        return { ...f, ...meta };
      });

      const filteredSubs = (node.subfolders || []).map(applyFilters).filter(Boolean);

      return {
        ...node,
        files: filesWithMeta,
        subfolders: filteredSubs,
      };
    };

    return applyFilters(folderResult.folder_tree);
  })();

  const handleFileSelect = async (fd) => {
    // Resolve old/new paths when the clicked node only contains minimal info
    setSelectedFile(null);
    let oldPath = fd.old_path || fd.path || null;
    let newPath = fd.new_path || null;

    if ((!oldPath || !newPath) && folderResult && folderResult.file_summaries) {
      const match = folderResult.file_summaries.find((s) => s.old_path === fd.path || s.file_name === fd.file_name);
      if (match) {
        oldPath = match.old_path;
        newPath = match.new_path;
        fd = { ...fd, ...match };
      }
    }

    try {
      if (!oldPath) {
        setSelectedFile(fd);
        return;
      }

      if (!newPath) {
        // Missing in NEW: show a clear summary instead of calling backend with invalid paths
        setSelectedFile({
          ...fd,
          old_text: null,
          new_text: null,
          diff_lines: [],
          semantic_diff: fd.semantic_diff || { changes: [], summary: {} },
          has_changes: true,
          unified_diff: [],
          summary: fd.summary || "Missing in NEW",
        });
        setStatus({ type: 'success', message: fd.summary || 'Missing in NEW' });
        return;
      }

      const data = await fetchFileDiff(oldPath, newPath);

      const enriched = {
        ...fd,
        old_text: data.old_text,
        new_text: data.new_text,
        diff_lines: data.diff_lines,
        semantic_diff: data.semantic_diff,
        has_changes: data.has_changes,
        unified_diff: data.unified_diff,
        summary: data.summary,
      };

      setSelectedFile(enriched);
      setStatus({ type: 'success', message: data.summary || 'Loaded diff' });
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Error loading diff';
      setStatus({ type: 'error', message: msg });
      setSelectedFile(fd);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <FolderTree tree={folderTree} onFileSelect={handleFileSelect} missingNewFiles={folderResult?.new_only_files || []} missingOldFiles={folderResult?.old_only_files || []} validationMap={missingValidations} onToggleValidation={(p,v)=>setMissingValidations((m)=>({...m,[p]:v}))} />
      </div>

      <div className="md:col-span-2">
        <div className="bg-white rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">{selectedFile ? `Folder Diff: ${selectedFile.component_name} / ${selectedFile.file_name}` : 'Diff Viewer'}</h3>
          {selectedFile ? (
            <div>
              {selectedFile.summary === 'Missing in NEW' ? (
                <div className="text-sm text-red-600">File is missing in NEW. You can review and validate it.</div>
              ) : (
                <DiffViewer oldText={selectedFile.old_text} newText={selectedFile.new_text} />
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Run a comparison and select a file from the left to view its diff.</p>
          )}
        </div>
      </div>

    </div>
  )
}
