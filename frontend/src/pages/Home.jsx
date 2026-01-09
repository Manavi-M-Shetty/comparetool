import { useState } from "react";
import { compareFilesUpload, compareFolders } from "../utils/api";
import DiffViewer from "../components/DiffViewer";
import CompareButton from "../components/CompareButton";
import StatusBar from "../components/StatusBar";

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
  const [folderResult, setFolderResult] = useState(null);
  const [selectedFolderDiff, setSelectedFolderDiff] = useState(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "info", message: "Ready" });

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

      // Preselect first file with changes
      if (data.file_diffs && data.file_diffs.length > 0) {
        const firstWithChanges =
          data.file_diffs.find((fd) => fd.has_changes) || data.file_diffs[0];
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

  // Build a simple tree structure: component -> files
  const folderTree = (() => {
    if (!folderResult || !folderResult.file_diffs) return {};
    const tree = {};
    folderResult.file_diffs.forEach((fd) => {
      if (!tree[fd.component_name]) {
        tree[fd.component_name] = [];
      }
      tree[fd.component_name].push(fd);
    });
    return tree;
  })();

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
            WinMerge-style comparison for individual files and folders.
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
              <div className="pt-2">
                <CompareButton
                  onClick={handleFolderCompare}
                  disabled={!oldFolder || !newFolder}
                  loading={loading && activeSource === "folder"}
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
                  </div>
                </div>
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
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Folder Results
            </h3>
            {!folderResult && (
              <p className="text-xs text-gray-500">
                Run a folder comparison to see components and files here.
              </p>
            )}
            {folderResult && (
              <div className="text-xs space-y-1">
                {Object.keys(folderTree).length === 0 && (
                  <p className="text-gray-500">No matched files.</p>
                )}
                {Object.entries(folderTree).map(([component, files]) => (
                  <div key={component} className="mb-2">
                    <div className="font-semibold text-gray-700">
                      {component}
                    </div>
                    <div className="ml-3 border-l border-gray-200 pl-2 space-y-0.5">
                      {files.map((fd, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveSource("folder");
                            setSelectedFolderDiff(fd);
                          }}
                          className={`block w-full text-left px-1 py-0.5 rounded ${
                            selectedFolderDiff &&
                            selectedFolderDiff.component_name ===
                              fd.component_name &&
                            selectedFolderDiff.file_name === fd.file_name
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {fd.file_name}{" "}
                          {fd.has_changes && (
                            <span className="text-[10px] text-yellow-700">
                              (changed)
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  comparison. The underlying diff is generated on the backend;
                  full file contents are not fetched to keep performance good
                  for large files.
                </p>
                <DiffViewer oldText={""} newText={""} />
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
