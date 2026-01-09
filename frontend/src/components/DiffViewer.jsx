import ReactDiffViewer from "react-diff-viewer";

/**
 * Side-by-side diff viewer using react-diff-viewer.
 * Highlights added lines in green and removed lines in red (WinMerge style).
 */
export default function DiffViewer({ oldText = "", newText = "" }) {
  // Handle very large files by truncating the preview to keep UI responsive
  const MAX_CHARS = 200_000; // ~200 KB per side

  const safeOld =
    typeof oldText === "string" && oldText.length > MAX_CHARS
      ? oldText.slice(0, MAX_CHARS) + "\n\n...[truncated]"
      : oldText;

  const safeNew =
    typeof newText === "string" && newText.length > MAX_CHARS
      ? newText.slice(0, MAX_CHARS) + "\n\n...[truncated]"
      : newText;

  return (
    <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50">
      <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-100 text-xs font-medium text-gray-700">
        <span>OLD</span>
        <span>NEW</span>
      </div>
      <div className="h-[420px] overflow-auto text-xs">
        <ReactDiffViewer
          oldValue={safeOld}
          newValue={safeNew}
          splitView
          useDarkTheme={false}
          hideLineNumbers={false}
          showDiffOnly={false}
        />
      </div>
    </div>
  );
}
