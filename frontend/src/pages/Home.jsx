import { useState, useEffect } from "react";
import { compareFilesUpload, compareFolders, compareFilePaths } from "../utils/api";
import DiffViewer from "../components/DiffViewer";
import CompareButton from "../components/CompareButton";
import StatusBar from "../components/StatusBar";
import FolderTree from "../components/FolderTree";

export default function Home() {
  // Section 1: file comparison
  const [oldFile, setOldFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [oldFileContent, setOldFileContent] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [fileSummary, setFileSummary] = useState("");

  // Section 2: folder comparison
  const [oldFolder, setOldFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [excelPath, setExcelPath] = useState("");
  const [folderResult, setFolderResult] = useState(null);
  const [selectedFolderDiff, setSelectedFolderDiff] = useState(null);
  const [componentFilter, setComponentFilter] = useState("");
  const [keyFilter, setKeyFilter] = useState("");

  // Loading and status state used across operations
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "info", message: "Ready" });

  // Quick backend health check to diagnose blank page / API issues
  useEffect(() => {
    fetch('/api/')
      .then((r) => r.json())
      .then(() => {
        setStatus((s) => (s.message === 'Ready' ? { type: 'success', message: 'Backend is available' } : s));
      })
      .catch((err) => {
        setStatus({ type: 'error', message: 'Backend not reachable. Start backend on port 8000 (see README).' });
        console.warn('Backend health-check failed:', err);
      });
  }, []);

  // Shared viewer: which source is active (file or folder)
  const [activeSource, setActiveSource] = useState("file"); // "file" | "folder"

  const readFileAsText = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setter(e.target?.result || "");
    };
    reader.readAsText(file);
  };

  const handleOldFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setOldFile(file);
    readFileAsText(file, setOldFileContent);
  };

  const handleNewFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setNewFile(file);
    readFileAsText(file, setNewFileContent);
  };

  const runFileCompare = async () => {
    if (!oldFile || !newFile) {
      setStatus({
        type: "error",
        message: "Please select both OLD and NEW files",
      });
      return;
    }

    setActiveSource("file");
    setLoading(true);
    setStatus({ type: "info", message: "Comparing files..." });
    setFileSummary("");

    try {
      const data = await compareFilesUpload(oldFile, newFile);
      setFileSummary(data.summary || "File comparison completed");
      setStatus({
        type: "success",
        message: data.summary || "File comparison completed",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Error during file comparison";
      setStatus({ type: "error", message: `Error: ${errorMessage}` });
      console.error("File comparison error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderCompare = async () => {
    if (!oldFolder || !newFolder) {
      setStatus({
        type: "error",
        message: "Please provide both OLD and NEW folder paths",
      });
      return;
    }

    setActiveSource("folder");
    setLoading(true);
    setStatus({ type: "info", message: "Comparing folders..." });
    setFolderResult(null);
    setSelectedFolderDiff(null);

    try {
      const data = await compareFolders(oldFolder, newFolder);
      setFolderResult(data);

      // Preselect first file with changes (use file_summaries)
      if (data.file_summaries && data.file_summaries.length > 0) {
        const firstWithChanges =
          data.file_summaries.find((fd) => fd.has_changes) || data.file_summaries[0];
        setSelectedFolderDiff(firstWithChanges);
      }

      setStatus({
        type: "success",
        message: `Compared ${data.total_components} components. Found changes in ${data.components_with_changes} components.`,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Error during folder comparison";
      setStatus({ type: "error", message: `Error: ${errorMessage}` });
      console.error("Folder comparison error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderPathPrompt = (setter, label) => {
    const path = prompt(
      `Enter the full path to ${label}:\n\nExample: C:\\Users\\YourName\\Documents\\Configs\\Old`,
      ""
    );
    if (path && path.trim()) {
      setter(path.trim());
    }
  };

  // Use folder_tree returned from backend (nested) and support filtering
  // Enrich file nodes with metadata from file_summaries so clicks always include both paths
  const folderTree = (() => {
    if (!folderResult || !folderResult.folder_tree) return null;

    // Build fast lookup of summaries by old_path
    const summaryMap = new Map((folderResult.file_summaries || []).map((fs) => [fs.old_path, fs]));

    // Simple filters: component (folder) and keyFilter searches file names and semantic summaries
    const applyFilters = (node) => {
      // merge metadata into files
      const filesWithMeta = (node.files || []).map((f) => {
        const meta = summaryMap.get(f.path) || {};
        return { ...f, ...meta };
      });

      // filter files
      const filteredFiles = filesWithMeta.filter((fd) => {
        if (componentFilter && !node.name.toLowerCase().includes(componentFilter.toLowerCase())) return false;
        if (keyFilter) {
          const k = keyFilter.toLowerCase();
          const semString = fd.semantic_diff && fd.semantic_diff.summary ? JSON.stringify(fd.semantic_diff.summary).toLowerCase() : "";
          const nameAndSummary = `${fd.file_name || ""} ${(fd.summary || "").toString()}`.toLowerCase();
          if (!nameAndSummary.includes(k) && !semString.includes(k)) return false;
        }
        return true;
      });

      // apply to subfolders recursively
      const filteredSubs = (node.subfolders || []).map(applyFilters).filter(Boolean);

      return {
        ...node,
        files: filteredFiles,
        subfolders: filteredSubs,
      };
    };

    return applyFilters(folderResult.folder_tree);
  })();

  const handleSelectFolderFile = async (fd) => {
    // Fetch full content and semantic diff from backend. Ensure we always pass both paths.
    setActiveSource("folder");
    setSelectedFolderDiff(null);
    setLoading(true);
    setStatus({ type: "info", message: "Fetching file diff..." });

    // Resolve old/new paths when the clicked node only contains minimal info
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
      if (!oldPath) throw new Error("Missing old path for selected file");

      if (!newPath) {
        // Missing in NEW: show a clear summary instead of calling backend with invalid paths
        setSelectedFolderDiff({
          ...fd,
          old_text: null,
          new_text: null,
          diff_lines: [],
          semantic_diff: fd.semantic_diff || { changes: [], summary: {} },
          has_changes: true,
          unified_diff: [],
          summary: fd.summary || "Missing in NEW",
        });
        setStatus({ type: "success", message: fd.summary          || "Missing in NEW" });
        return;
      }

      const data = await compareFilePaths(oldPath, newPath);

      // Merge returned data into fd for viewer
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
      setSelectedFolderDiff(enriched);

      setStatus({ type: "success", message: data.summary || "Loaded diff" });
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Error loading diff";
      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };


  // Determine which content to show in diff viewer
  const viewerOldText =
    activeSource === "file"
      ? oldFileContent
      : ""; // for folder, we only have diff summary, not full content

  const viewerNewText =
    activeSource === "file"
      ? newFileContent
      : "";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Config Compare Tool
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
             Comparison for individual files and folders.
          </p>
        </div>

        {/* Top sections: file compare + folder compare controls */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Section 1: Compare Two Files */}
          <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Compare Two Files
            </h2>
            <p className="text-xs text-gray-500">
              Select OLD and NEW files to compare. Large files are truncated in
              the viewer for performance.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  OLD file
                </label>
                <input
                  type="file"
                  onChange={handleOldFileChange}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  NEW file
                </label>
                <input
                  type="file"
                  onChange={handleNewFileChange}
                  className="w-full text-xs"
                />
              </div>
              <div className="pt-2">
                <CompareButton
                  onClick={runFileCompare}
                  disabled={!oldFile || !newFile}
                  loading={loading && activeSource === "file"}
                />
              </div>

              {fileSummary && (
                <div className="mt-2 text-xs text-gray-700">
                  <span className="font-semibold">Summary: </span>
                  {fileSummary}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Compare Two Folders */}
          <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Compare Two Folders
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  OLD folder path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={oldFolder}
                    onChange={(e) => setOldFolder(e.target.value)}
                    placeholder="C:\path\to\old\folder"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      handleFolderPathPrompt(setOldFolder, "OLD folder")
                    }
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs"
                  >
                    Browse
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  NEW folder path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    placeholder="C:\path\to\new\folder"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      handleFolderPathPrompt(setNewFolder, "NEW folder")
                    }
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs"
                  >
                    Browse
                  </button>
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <CompareButton
                  onClick={handleFolderCompare}
                  disabled={!oldFolder || !newFolder}
                  loading={loading && activeSource === "folder"}
                />

              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={excelPath}
                  onChange={(e) => setExcelPath(e.target.value)}
                  placeholder="Optional Excel path to update (C:\\path\\to\\workbook.xlsx)"
                  className="px-2 py-1 text-xs border rounded"
                />
                <input
                  type="text"
                  value={componentFilter}
                  onChange={(e) => setComponentFilter(e.target.value)}
                  placeholder="Filter components"
                  className="px-2 py-1 text-xs border rounded"
                />
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2">
                <input
                  type="text"
                  value={keyFilter}
                  onChange={(e) => setKeyFilter(e.target.value)}
                  placeholder="Filter by key or change"
                  className="px-2 py-1 text-xs border rounded"
                />
              </div>

              {folderResult && (
                <div className="mt-2 text-xs text-gray-700 space-y-1">
                  <div>
                    <span className="font-semibold">Components: </span>
                    {folderResult.total_components}
                  </div>
                  <div>
                    <span className="font-semibold">With changes: </span>
                    {folderResult.components_with_changes}
                  </div>                  <div>
                    <span className="font-semibold">New-only files: </span>
                    {(folderResult.new_only || []).length}
                  </div>                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div>
          <StatusBar status={status.type} message={status.message} />
        </div>

        {/* Main content: file tree + diff viewer */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: file tree for folder comparison */}
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4 h-[460px] overflow-auto">
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Search files or folders" value={keyFilter} onChange={(e) => setKeyFilter(e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded" />
              <input type="text" placeholder="Filter folder" value={componentFilter} onChange={(e) => setComponentFilter(e.target.value)} className="px-2 py-1 text-xs border rounded w-40" />
            </div>
            <FolderTree tree={folderTree} onFileSelect={handleSelectFolderFile} search={keyFilter} />
          </div>

          {/* Right: diff viewer */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-3 md:p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              {activeSource === "file"
                ? "File Diff"
                : selectedFolderDiff
                ? `Folder Diff: ${selectedFolderDiff.component_name} / ${selectedFolderDiff.file_name}`
                : "Diff Viewer"}
            </h3>

            {activeSource === "file" ? (
              oldFile || newFile ? (
                <DiffViewer oldText={oldFileContent} newText={newFileContent} />
              ) : (
                <p className="text-xs text-gray-500">
                  Select two files and click &quot;Compare and Update&quot; to
                  see a side-by-side diff.
                </p>
              )
            ) : selectedFolderDiff ? (
              <div className="text-xs text-gray-600">
                <p className="mb-2">
                  This view uses the same side-by-side layout as file
                  comparison. The underlying diff is generated on the backend; you
                  can view the full files and semantic changes here.
                </p>
                <div className="mb-2 flex gap-2">
                  <input type="text" placeholder="Search in diff" value={keyFilter} onChange={(e) => setKeyFilter(e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded" />
                </div>
                <DiffViewer
                  oldText={selectedFolderDiff.old_text || ""}
                  newText={selectedFolderDiff.new_text || ""}
                  semanticChanges={
                    (selectedFolderDiff.semantic_diff && selectedFolderDiff.semantic_diff.changes) || []
                  }
                  searchTerm={keyFilter}
                />

                {selectedFolderDiff.semantic_diff && (
                  <div className="mt-3 text-xs">
                    <div className="font-semibold">Semantic changes:</div>
                    <ul className="list-disc ml-5">
                      {selectedFolderDiff.semantic_diff.changes.map((c, i) => (
                        <li key={i}>
                          <strong>{c.type}</strong> {c.key || (c.old_key && `${c.old_key} → ${c.new_key}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Run a comparison and select a file from the left to view its
                diff.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}