// frontend/src/components/DiffViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDiffViewer from 'react-diff-viewer';

export default function DiffViewer({
  oldText = '',
  newText = '',
  status,
  onNewChange,
  comments = [],            // [{ lineNumber, comment }, ...]
  onCommentChange,
  fileName = '',
}) {
  const [editableNewText, setEditableNewText] = useState(newText);
  const [activeLine, setActiveLine] = useState(null);  // line number with open popover
  const [popoverTop, setPopoverTop] = useState(null);  // y-position of popover
  const [tempComment, setTempComment] = useState('');  // comment being edited
  const containerRef = useRef(null);                   // scrollable diff container

  useEffect(() => {
    setEditableNewText(newText);
    setActiveLine(null);
    setPopoverTop(null);
    setTempComment('');
  }, [newText, fileName]);

  const handleNewChange = (e) => {
    const value = e.target.value;
    setEditableNewText(value);
    onNewChange && onNewChange(value);
  };

  const getExistingComment = (lineNumber) =>
    comments.find((c) => c.lineNumber === lineNumber)?.comment || '';

  // Called when a line number in react-diff-viewer is clicked
  const handleLineNumberClick = (lineId, event) => {
    // lineId is like "L-10" or "R-10"
    const match = String(lineId).match(/\d+/);
    if (!match) return;

    const lineNumber = parseInt(match[0], 10);

    if (!containerRef.current || !event || !event.clientY) {
      // Fallback if event/DOM not available
      setActiveLine(lineNumber);
      setPopoverTop(16);
      setTempComment(getExistingComment(lineNumber));
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const offsetY =
      event.clientY - rect.top + containerRef.current.scrollTop;

    setActiveLine(lineNumber);
    setPopoverTop(offsetY);
    setTempComment(getExistingComment(lineNumber));
  };

  const handleClosePopover = () => {
    setActiveLine(null);
    setPopoverTop(null);
    setTempComment('');
  };

  const handleSaveComment = () => {
    if (onCommentChange && activeLine != null) {
      onCommentChange(activeLine, tempComment);
    }
    // Close popover after saving
    handleClosePopover();
  };

  // Special cases
  if (status === 'added') {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="text-sm text-blue-600 mb-4">
          File exists only in NEW.
        </div>
        <textarea
          className="w-full h-96 p-2 border rounded font-mono text-sm"
          value={editableNewText}
          onChange={handleNewChange}
          placeholder="Edit NEW content..."
        />
      </div>
    );
  }

  if (status === 'missing' || status === 'missing_new') {
    return (
      <div className="p-4 border rounded-lg bg-rose-50 text-sm text-rose-700">
        File exists only in OLD. There is no NEW version to compare.
      </div>
    );
  }

  // Filter out empty comments for the summary section
  const savedComments = (comments || []).filter(
    (c) => c.comment && c.comment.trim()
  );

  return (
    <div className="mt-2 border rounded-lg overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 bg-gray-100 text-xs font-medium">
        <span>OLD (Read-only)</span>
        <span>NEW (Editable – click line number to comment)</span>
      </div>

      {/* Diff viewer with inline popover */}
      <div
        ref={containerRef}
        className="relative h-[360px] overflow-auto text-xs border-b bg-white"
      >
        <ReactDiffViewer
          oldValue={oldText || ''}
          newValue={editableNewText || ''}
          splitView
          showDiffOnly={false}
          onLineNumberClick={handleLineNumberClick}
          styles={{
            gutter: { cursor: 'pointer' }, // line numbers look clickable
          }}
        />

        {/* Floating comment popover aligned with clicked line */}
        {activeLine != null && popoverTop != null && (
          <div
            className="absolute right-2 w-72 bg-white border border-emerald-400 rounded-md shadow-lg p-2 z-10"
            style={{ top: popoverTop }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-emerald-700">
                Comment for line {activeLine}
              </span>
              <button
                type="button"
                onClick={handleClosePopover}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <textarea
              className="w-full text-xs border rounded p-1.5 resize-none h-16 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
              placeholder="Enter comment about this change..."
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
            />
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                onClick={handleSaveComment}
                className="px-3 py-1 text-[11px] bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Save comment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editable NEW textarea */}
      <div className="p-4 bg-white border-b">
        <h4 className="font-medium mb-2 text-sm">Edit NEW Content</h4>
        <textarea
          className="w-full h-40 p-2 border rounded font-mono text-sm"
          value={editableNewText}
          onChange={handleNewChange}
          placeholder="Edit the NEW content here..."
        />
      </div>

      {/* Saved comments summary */}
      <div className="p-4 bg-gray-50">
        <h4 className="font-medium mb-2 text-sm">Saved comments</h4>
        {savedComments.length === 0 ? (
          <div className="text-xs text-slate-400">
            No comments added yet. Click a line number in the diff above to
            add a comment.
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {savedComments.map((c, idx) => (
              <div
                key={idx}
                className="p-2 bg-white border rounded flex items-start gap-2"
              >
                <span className="text-[11px] font-semibold text-slate-500">
                  Line {c.lineNumber}:
                </span>
                <span className="text-[13px] text-slate-800">
                  {c.comment}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}