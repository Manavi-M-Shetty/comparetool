// frontend/src/components/DiffViewer.jsx
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import html2canvas from 'html2canvas';
import { uploadDiffScreenshot } from '../utils/api';

// Custom dark theme styles for ReactDiffViewer
const darkDiffStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#0f172a', // slate-900
      diffViewerColor: '#e2e8f0',      // gray-200
      addedBackground: '#064e3b',      // emerald-900
      addedColor: '#a7f3d0',           // emerald-200
      removedBackground: '#7f1d1d',    // red-900
      removedColor: '#fecaca',         // red-200
      wordAddedBackground: '#059669',  // emerald-600
      wordRemovedBackground: '#dc2626',// red-600
      addedGutterBackground: '#065f46',
      removedGutterBackground: '#991b1b',
      gutterBackground: '#1e293b',     // slate-800
      gutterColor: '#64748b',          // slate-500
      codeFoldGutterBackground: '#1e293b',
      codeFoldBackground: '#1e293b',
      emptyLineBackground: '#0f172a',
      gutterBorder: '#334155',         // slate-700
      lineNumber: '#64748b',
      diffViewerTitleBackground: '#1e293b',
      diffViewerTitleColor: '#cbd5e1',
      diffViewerTitleBorder: '#334155',
    }
  },
  line: {
    padding: '4px 0',
    fontSize: '12px',
    lineHeight: '1.5',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  gutter: {
    minWidth: '40px',
    padding: '0 8px',
  }
};

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
    onReady,             // callback when diff is ready
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
  
  useLayoutEffect(() => {
    window.dispatchEvent(new CustomEvent('diff-rendered', { detail: { fileName, filePath } }));
    if (onReady) onReady();
  }, [oldText, editableNewText, fileName]);

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
    async captureScreenshot(options = {}) {
      const lowerPath = (filePath || '').toLowerCase();
      const isConfigFile =
        lowerPath.includes('/configs/') || lowerPath.includes('\\configs\\');

      const hasDifferences = status === 'modified';

      if (!excelPath) {
        if (!options.silent) alert('Excel path not set. Cannot save screenshot.');
        return;
      }
      if (!isConfigFile) {
        if (!options.silent) alert('Current file is not under a Configs folder; screenshot skipped.');
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

        const changedCells = await findChangedCellsWithRetry();
        if (!changedCells || changedCells.length === 0) {
          if (!options.silent) alert('No highlighted differences found to capture.');
          return;
        }

        const table = diffEl.querySelector('table');
        if (!table) {
          if (!options.silent) alert('Diff table not found; cannot capture screenshot.');
          return;
        }

        const allRows = Array.from(table.querySelectorAll('tr'));
        const rowIndexSet = new Set();

        changedCells.forEach((cell) => {
          const row = cell.closest('tr');
          if (!row) return;
          const idx = allRows.indexOf(row);
          if (idx === -1) return;

          rowIndexSet.add(idx);
          if (idx > 0) rowIndexSet.add(idx - 1);
          if (idx < allRows.length - 1) rowIndexSet.add(idx + 1);
        });

        const indices = Array.from(rowIndexSet).sort((a, b) => a - b);
        if (!indices.length) {
          if (!options.silent) alert('No highlighted differences found to capture.');
          return;
        }

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-10000px';
        tempContainer.style.top = '0';
        tempContainer.style.background = '#0f172a'; // Match dark theme bg
        tempContainer.style.color = '#e2e8f0';      // Match dark theme text
        tempContainer.style.padding = '10px';
        tempContainer.style.boxSizing = 'border-box';
        
        // 🔹 Width: 1500px to keep columns spaced comfortably
        const CAPTURE_WIDTH = 1500;
        tempContainer.style.width = `${CAPTURE_WIDTH}px`; 
        
        const tempTable = document.createElement('table');
        tempTable.className = table.className;
        tempTable.style.borderCollapse = 'collapse';
        tempTable.style.width = '100%'; 
        tempTable.style.tableLayout = 'fixed'; 

        // 🔹 Font Size: 11px for sharp, compact text
        tempTable.style.fontFamily = '"Consolas","Menlo","Courier New",monospace';
        tempTable.style.fontSize = '11px';   
        tempTable.style.lineHeight = '1.3';

        indices.forEach((idx) => {
          const cloneRow = allRows[idx].cloneNode(true);
          
          cloneRow.querySelectorAll('td, th').forEach((cell) => {
            cell.style.padding = '2px 6px';
            
            // 🔹 CRITICAL FIX: Prevent line numbers from wrapping
            const className = (cell.className || '').toLowerCase();
            if (className.includes('gutter')) {
                cell.style.whiteSpace = 'nowrap';
                cell.style.wordBreak = 'keep-all';
                cell.style.minWidth = '30px'; 
                cell.style.width = '1%'; // Shrink to fit content
                cell.style.textAlign = 'right';
            } else {
                // Code cells allow breaking so long strings don't expand container
                cell.style.wordBreak = 'break-word';
                cell.style.whiteSpace = 'pre-wrap';
            }

            const computedStyle = window.getComputedStyle(cell);
            cell.style.backgroundColor = computedStyle.backgroundColor;
            cell.style.color = computedStyle.color;
            cell.style.borderBottom = '1px solid #334155';
          });
          
          tempTable.appendChild(cloneRow);
        });

        tempContainer.appendChild(tempTable);
        document.body.appendChild(tempContainer);

        // 🔹 Scale: 1.2 to keep image size manageable
        let targetScale = 1.2; 
        
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: '#0f172a', 
          scale: targetScale,
          width: CAPTURE_WIDTH, 
          windowWidth: CAPTURE_WIDTH,
        });

        document.body.removeChild(tempContainer);

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((b) => {
            if (!b) return reject(new Error('Failed to convert canvas to Blob'));
            resolve(b);
          }, 'image/png');
        });

        if (!blob || blob.size === 0) throw new Error('Screenshot blob is empty');

        const resp = await uploadDiffScreenshot(
          excelPath,
          fileName || 'diff',
          blob
        );
        if (!options.silent) alert(resp.message || 'Screenshot added to Excel.');
      } catch (err) {
        console.error('Error capturing diff screenshot:', err);
        if (!options.silent) alert('Failed to capture screenshot.');
      }
    },
  }));

  if (status === 'added') {
    return (
      <div className="p-4 border border-white/10 rounded-lg bg-emerald-900/10">
        <div className="text-sm text-emerald-400 mb-4 font-semibold">
          File exists only in NEW.
        </div>
        <textarea
          className="w-full h-96 p-3 border border-white/10 rounded-lg font-mono text-sm bg-black/30 text-gray-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          value={editableNewText}
          onChange={handleNewChange}
          placeholder="Edit NEW content..."
        />
      </div>
    );
  }

  if (status === 'missing' || status === 'missing_new') {
    return (
      <div className="p-4 border border-red-500/20 rounded-lg bg-red-900/10 text-sm text-red-300">
        File exists only in OLD. There is no NEW version to compare.
      </div>
    );
  }

  const savedComments = (comments || []).filter(
    (c) => c.comment && c.comment.trim()
  );

  return (
    <div className="mt-2 border border-white/10 rounded-lg overflow-hidden bg-slate-900/50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between px-4 py-2 bg-black/20 text-xs font-semibold tracking-wide border-b border-white/10">
        <span className="text-gray-400">OLD (Read-only)</span>
        <span className="text-purple-300">NEW (Editable – click line number to comment)</span>
      </div>

      {/* Diff viewer with inline popover */}
      <div
        ref={containerRef}
        className="relative h-[360px] overflow-auto text-xs border-b border-white/10 bg-slate-900 custom-scrollbar"
      >
        <div ref={diffRef}>
          <ReactDiffViewer
            oldValue={oldText || ''}
            newValue={editableNewText || ''}
            splitView
            useDarkTheme={true}
            styles={darkDiffStyles}
            showDiffOnly={false}
            onLineNumberClick={handleLineNumberClick}
          />
        </div>

        {/* Floating comment popover */}
        {activeLine != null && popoverTop != null && (
          <div
            className="absolute right-2 w-72 bg-slate-800 border border-purple-500 rounded-lg shadow-2xl p-3 z-10"
            style={{ top: popoverTop }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-300">
                Comment for line {activeLine}
              </span>
              <button
                type="button"
                onClick={handleClosePopover}
                className="text-[11px] text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="mb-2 text-[10px] text-gray-300 font-mono whitespace-pre-wrap bg-black/30 border border-white/10 rounded px-2 py-1 max-h-20 overflow-y-auto">
              {(editableNewText || '').split('\n')[activeLine - 1] ||
                '(empty line)'}
            </div>
            <textarea
              className="w-full text-xs bg-slate-700 border border-slate-600 text-white rounded p-2 resize-none h-20 focus:ring-1 focus:ring-purple-400 focus:border-purple-400 focus:outline-none"
              placeholder="Enter comment about this change..."
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              autoFocus
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveComment}
                className="px-3 py-1.5 text-[11px] bg-purple-600 text-white font-medium rounded hover:bg-purple-500 transition-colors"
              >
                Save comment
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/10 border-b border-white/5">
        <h4 className="font-semibold mb-2 text-xs uppercase text-gray-400">Edit NEW Content</h4>
        <textarea
          className="w-full h-40 p-3 border border-white/10 rounded-lg font-mono text-sm bg-slate-900/50 text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
          value={editableNewText}
          onChange={handleNewChange}
          placeholder="Edit the NEW content here..."
        />
      </div>

      <div className="p-4 bg-black/20">
        <h4 className="font-semibold mb-2 text-xs uppercase text-gray-400">Saved comments (this file)</h4>
        {savedComments.length === 0 ? (
          <div className="text-xs text-gray-500 italic">
            No comments added yet.
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {savedComments.map((c, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-800/80 border border-white/10 rounded-lg flex flex-col gap-1"
              >
                <div className="text-[11px] text-purple-300 font-semibold">
                  Line {c.lineNumber}
                </div>
                {c.lineContent && (
                  <div className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap bg-black/30 border border-white/5 rounded px-2 py-1">
                    {c.lineContent}
                  </div>
                )}
                <div className="text-[12px] text-gray-200 mt-1">
                  {c.comment}
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