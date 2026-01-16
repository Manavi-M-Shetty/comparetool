import React from "react";
import ReactDiffViewer from "react-diff-viewer";

export default function DiffViewer({
  oldText = "",
  newText = "",
  status,
}) {
  // Handle non-diffable files
  if (status === "added") {
    return <div className="p-4 text-sm text-blue-600">File exists only in NEW.</div>;
  }

  if (status === "missing") {
    return <div className="p-4 text-sm text-red-600">File exists only in OLD.</div>;
  }

  return (
    <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50">
      <div className="flex justify-between px-4 py-2 bg-gray-100 text-sm font-medium">
        <span>OLD</span>
        <span>NEW</span>
      </div>

      <div className="h-[520px] overflow-auto text-xs">
        <ReactDiffViewer
          oldValue={oldText || ""}
          newValue={newText || ""}
          splitView
          showDiffOnly={false}
        />
      </div>
    </div>
  );
}
