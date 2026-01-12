import React from "react";
import ReactDiffViewer from "react-diff-viewer";

export default function DiffViewer({ oldText = "", newText = "" }) {
  const MAX_CHARS = 200_000; // limit preview for large files (~200KB)

  const safeOld =
    typeof oldText === "string" && oldText.length > MAX_CHARS
      ? oldText.slice(0, MAX_CHARS) + "\n\n...[truncated]"
      : oldText || "No content";

  const safeNew =
    typeof newText === "string" && newText.length > MAX_CHARS
      ? newText.slice(0, MAX_CHARS) + "\n\n...[truncated]"
      : newText || "No content";

  return (
    <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50">
      <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-100 text-sm font-medium text-gray-700">
        <span>OLD</span>
        <span>NEW</span>
      </div>

      <div className="h-[520px] overflow-auto text-xs">
        <ReactDiffViewer
          oldValue={safeOld}
          newValue={safeNew}
          splitView={true}
          showDiffOnly={false}
          hideLineNumbers={false}
          useDarkTheme={false}
        />
      </div>
    </div>
  );
}
