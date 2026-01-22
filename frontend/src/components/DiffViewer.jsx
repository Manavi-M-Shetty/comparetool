// frontend/src/components/DiffViewer.jsx
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import html2canvas from 'html2canvas';
import { uploadDiffScreenshot } from '../utils/api';



const DiffViewer = forwardRef(function DiffViewer(
  {
    oldText = '',
    newText = '',
    status,
    onNewChange,
    comments = [],        // [{ lineNumber, comment, lineContent }, ...]
    onCommentChange,
    fileName = '',
    filePath = '',        // full path for Configs check
    excelPath = '',       // cleaned Excel path from parent
  },
  ref
) {
  const [editableNewText, setEditableNewText] = useState(newText);
  const [activeLine, setActiveLine] = useState(null);
  const [popoverTop, setPopoverTop] = useState(null);
  const [tempComment, setTempComment] = useState('');
  const containerRef = useRef(null); // scrollable diff container
  const diffRef = useRef(null);      // actual diff DOM for screenshot

  useEffect(() => {
    setEditableNewText(newText);
    setActiveLine(null);
    setPopoverTop(null);
    setTempComment('');
  }, [newText, fileName, filePath]);

  const handleNewChange = (e) => {
    const value = e.target.value;
    setEditableNewText(value);
    onNewChange && onNewChange(value);
  };

  const getExistingComment = (lineNumber) =>
    comments.find((c) => c.lineNumber === lineNumber)?.comment || '';

  // line number click -> open popover
  const handleLineNumberClick = (lineId, event) => {
    const match = String(lineId).match(/\d+/);
    if (!match) return;
    const lineNumber = parseInt(match[0], 10);

    if (!containerRef.current || !event || !event.clientY) {
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
      const lines = (editableNewText || '').split('\n');
      const lineContent = lines[activeLine - 1] || '';
      onCommentChange(activeLine, tempComment, lineContent);
    }
    handleClosePopover();
  };

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // ✅ Expose captureScreenshot() to parent
  useImperativeHandle(ref, () => ({
    async captureScreenshot() {
      // Only for files under CONFIGS folder
      const lowerPath = (filePath || '').toLowerCase();
      const isConfigFile =
        lowerPath.includes('/configs/') || lowerPath.includes('\\configs\\');

      // We only want real diffs for screenshot
      const hasDifferences = status === 'modified';

      if (!excelPath) {
        alert('Excel path not set. Cannot save screenshot.');
        return;
      }
      if (!isConfigFile) {
        alert('Current file is not under a Configs folder; screenshot skipped.');
        return;
      }
      if (!hasDifferences) {
        alert('No highlighted differences to capture for this file.');
        return;
      }
      if (!diffRef.current) {
        console.warn('Diff DOM not ready for screenshot.');
        return;
      }

      try {
        const diffEl = diffRef.current;

        // Retry a few times to wait for highlighted cells
        const findChangedCellsWithRetry = async (retries = 3, interval = 300) => {
          for (let attempt = 0; attempt < retries; attempt++) {
            const cells = diffEl.querySelectorAll(
              '[class*="diff-added"], [class*="diff-removed"], [class*="diff-changed"]'
            );
            if (cells && cells.length > 0) return cells;
            await delay(interval);
          }
          return [];
        };

        // 1) Find all changed/highlighted cells in the diff (with retry)
        const changedCells = await findChangedCellsWithRetry();
        if (!changedCells || changedCells.length === 0) {
          alert('No highlighted differences found to capture.');
          return;
        }

        // 2) Work on the diff table rows (<tr>) so we can clone
        //    the changed lines + 1 line above and 1 line below.
        const table = diffEl.querySelector('table');
        if (!table) {
          alert('Diff table not found; cannot capture screenshot.');
          return;
        }

        const allRows = Array.from(table.querySelectorAll('tr'));
        const rowIndexSet = new Set();

        changedCells.forEach((cell) => {
          const row = cell.closest('tr');
          if (!row) return;
          const idx = allRows.indexOf(row);
          if (idx === -1) return;

          // This row has a diff
          rowIndexSet.add(idx);
          // One line above
          if (idx > 0) rowIndexSet.add(idx - 1);
          // One line below
          if (idx < allRows.length - 1) rowIndexSet.add(idx + 1);
        });

        const indices = Array.from(rowIndexSet).sort((a, b) => a - b);
        if (!indices.length) {
          alert('No highlighted differences found to capture.');
          return;
        }
        // 🔴 NOTE: no row limit here – ALL highlighted rows (+1 line around) are included.

        // 3) Create a temporary off-screen container with only those rows
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-10000px';
        tempContainer.style.top = '0';
        tempContainer.style.background = '#ffffff';
        tempContainer.style.padding = '4px';
        tempContainer.style.boxSizing = 'border-box';

        // ⚠️ Do NOT constrain width or hide overflow; we want both columns.
        // tempContainer.style.width = ...;
        // tempContainer.style.maxWidth = ...;
        // tempContainer.style.overflowX = 'hidden';

        const tempTable = document.createElement('table');
        tempTable.className = table.className;
        tempTable.style.borderCollapse = 'collapse';
        // Let the table use its natural width (so OLD + NEW are both visible)
        tempTable.style.width = 'auto';

        // Make screenshot text bigger and clearer
        tempTable.style.fontFamily =
          '"Consolas","Menlo","Courier New",monospace';
        tempTable.style.fontSize = '16px';   // adjust if you want larger text
        tempTable.style.lineHeight = '1.5';

        indices.forEach((idx) => {
          const cloneRow = allRows[idx].cloneNode(true);

          // Standardize padding for readability
          cloneRow.querySelectorAll('td, th').forEach((cell) => {
            cell.style.padding = '2px 8px';
          });

          tempTable.appendChild(cloneRow);
        });

        tempContainer.appendChild(tempTable);
        document.body.appendChild(tempContainer);

        // Force layout so offsetWidth/offsetHeight are accurate
        const width = tempContainer.offsetWidth || MAX_VISUAL_WIDTH;
        const height = tempContainer.offsetHeight || 1000;

        // 4) Choose a scale dynamically so we don't exceed canvas limits
        let targetScale = 2; // ideal DPI for clarity
        const MAX_CANVAS_SIDE = 14000; // safe upper bound for most browsers

        // Estimated max side if we rendered at targetScale
        const estMaxSide = Math.max(width * targetScale, height * targetScale);
        if (estMaxSide > MAX_CANVAS_SIDE) {
          // Reduce scale to fit within MAX_CANVAS_SIDE
          const factor = MAX_CANVAS_SIDE / estMaxSide;
          targetScale = Math.max(0.8, targetScale * factor); // don't go below 0.8
        }

        const canvas = await html2canvas(tempContainer, {
          backgroundColor: '#ffffff',
          scale: targetScale,
        });

        console.log('Canvas size:', canvas.width, canvas.height);

        // Cleanup temp DOM
        document.body.removeChild(tempContainer);

        // 5) Convert canvas directly to Blob
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((b) => {
            if (!b) {
              return reject(new Error('Failed to convert canvas to Blob'));
            }
            resolve(b);
          }, 'image/png');
        });

        if (!blob || blob.size === 0) {
          throw new Error('Screenshot blob is empty');
        }

        console.log('Screenshot blob size (bytes):', blob.size);

        const resp = await uploadDiffScreenshot(
          excelPath,
          fileName || 'diff',
          blob
        );
        console.log('Screenshot upload response:', resp);
        alert(resp.message || 'Screenshot added to Excel.');
      } catch (err) {
        console.error('Error capturing diff screenshot:', err);
        if (err.response && err.response.data) {
          console.error('Screenshot API error:', err.response.data);
        }
        alert('Failed to capture screenshot.');
      }
    },
  }));

  // Special cases can now safely early-return (all hooks are above)
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

  const savedComments = (comments || []).filter(
    (c) => c.comment && c.comment.trim()
  );

  return (
    <div className="mt-2 border rounded-lg overflow-hidden bg-gray-50 flex flex-col">
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
        {/* area to screenshot */}
        <div ref={diffRef}>
          <ReactDiffViewer
            oldValue={oldText || ''}
            newValue={editableNewText || ''}
            splitView
            showDiffOnly={false}
            onLineNumberClick={handleLineNumberClick}
            styles={{
              gutter: { cursor: 'pointer' },
            }}
          />
        </div>

        {/* Floating comment popover */}
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
            <div className="mb-1 text-[11px] text-slate-600 font-mono whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded px-1 py-0.5">
              {(editableNewText || '').split('\n')[activeLine - 1] ||
                '(empty line)'}
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

      {/* Editable NEW textarea (full file editor) */}
      <div className="p-4 bg-white border-b">
        <h4 className="font-medium mb-2 text-sm">Edit NEW Content</h4>
        <textarea
          className="w-full h-40 p-2 border rounded font-mono text-sm"
          value={editableNewText}
          onChange={handleNewChange}
          placeholder="Edit the NEW content here..."
        />
      </div>

      {/* Saved comments (this file) */}
      <div className="p-4 bg-gray-50">
        <h4 className="font-medium mb-2 text-sm">Saved comments (this file)</h4>
        {savedComments.length === 0 ? (
          <div className="text-xs text-slate-400">
            No comments added yet.
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {savedComments.map((c, idx) => (
              <div
                key={idx}
                className="p-2 bg-white border rounded flex flex-col gap-1"
              >
                <div className="text-[11px] text-slate-500 font-semibold">
                  Line {c.lineNumber}
                </div>
                {c.lineContent && (
                  <div className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded px-1 py-0.5">
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
    </div>
  );
});

export default DiffViewer;