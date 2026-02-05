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
import { getComponentName } from '../utils/fileUtils';

// Light theme styles for ReactDiffViewer
const diffStyles = {
  variables: {
    light: {
      diffViewerBackground: '#ffffff',
      diffViewerColor: '#111827', // slate-900
      addedBackground: 'rgba(34, 197, 94, 0.12)', // green-500 @12%
      addedColor: '#166534', // green-700
      removedBackground: 'rgba(248, 113, 113, 0.12)', // red-400 @12%
      removedColor: '#b91c1c', // red-700
      wordAddedBackground: 'rgba(34, 197, 94, 0.35)',
      wordRemovedBackground: 'rgba(248, 113, 113, 0.35)',
      addedGutterBackground: 'rgba(34, 197, 94, 0.10)',
      removedGutterBackground: 'rgba(248, 113, 113, 0.10)',
      gutterBackground: '#f9fafb', // slate-50
      gutterColor: '#6b7280', // slate-500
      codeFoldGutterBackground: '#f3f4f6', // slate-100
      codeFoldBackground: '#f3f4f6',
      emptyLineBackground: '#ffffff',
      gutterBorder: '#e5e7eb', // slate-200
      lineNumber: '#6b7280',
      diffViewerTitleBackground: '#f9fafb',
      diffViewerTitleColor: '#111827',
      diffViewerTitleBorder: '#e5e7eb',
    },
  },
  line: {
    padding: '2px 0',
    fontSize: '12px',
    lineHeight: '1.6',
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    color: '#111827', // dark text on white
  },
  gutter: {
    minWidth: '50px',
    padding: '0 12px',
    cursor: 'pointer',
  },
  contentText: {
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    color: '#111827',
  },
};

// Comment Badge Component
function CommentBadge({ count }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-purple-600 text-white rounded-full">
      {count}
    </span>
  );
}

// Section Header Component
function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-600">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          {subtitle && (
            <p className="text-[10px] text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

const DiffViewer = forwardRef(function DiffViewer(
  {
    oldText = '',
    newText = '',
    status,
    onNewChange,
    comments = [],
    onCommentChange,
    fileName = '',
    filePath = '',
    excelPath = '',
    serverName = '',            // 👈 NEW: server name from parent
    onReady,
  },
  ref
) {
  const [editableNewText, setEditableNewText] = useState(newText);
  const [activeLine, setActiveLine] = useState(null);
  const [popoverTop, setPopoverTop] = useState(null);
  const [tempComment, setTempComment] = useState('');
  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'edit' | 'comments'
  const containerRef = useRef(null);
  const diffRef = useRef(null);

  useEffect(() => {
    setEditableNewText(newText);
    setActiveLine(null);
    setPopoverTop(null);
    setTempComment('');
  }, [newText, fileName, filePath]);

  useLayoutEffect(() => {
    window.dispatchEvent(
      new CustomEvent('diff-rendered', { detail: { fileName, filePath } })
    );
    if (onReady) onReady();
  }, [oldText, editableNewText, fileName, filePath, onReady]);

  const handleNewChange = (e) => {
    const value = e.target.value;
    setEditableNewText(value);
    onNewChange && onNewChange(value);
  };

  const getExistingComment = (lineNumber) =>
    comments.find((c) => c.lineNumber === lineNumber)?.comment || '';

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
    setPopoverTop(
      Math.max(
        16,
        Math.min(offsetY, containerRef.current.scrollHeight - 250)
      )
    );
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

  useImperativeHandle(ref, () => ({
    async captureScreenshot(options = {}) {
      const lowerPath = (filePath || '').toLowerCase();
      const isConfigFile =
        lowerPath.includes('/configs/') || lowerPath.includes('\\configs\\');

      if (!excelPath) {
        if (!options.silent)
          alert('Excel path not set. Cannot save screenshot.');
        return;
      }
      if (!isConfigFile) {
        if (!options.silent)
          alert(
            'Current file is not under a Configs folder; screenshot skipped.'
          );
        return;
      }
      if (!diffRef.current) {
        console.warn('Diff DOM not ready for screenshot.');
        return;
      }

      try {
        const diffEl = diffRef.current;

        const findChangedCellsWithRetry = async (
          retries = 3,
          interval = 300
        ) => {
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
          if (!options.silent)
            alert('No highlighted differences found to capture.');
          return;
        }

        const table = diffEl.querySelector('table');
        if (!table) {
          if (!options.silent)
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
          rowIndexSet.add(idx);
          if (idx > 0) rowIndexSet.add(idx - 1);
          if (idx < allRows.length - 1) rowIndexSet.add(idx + 1);
        });

        const indices = Array.from(rowIndexSet).sort((a, b) => a - b);
        if (!indices.length) {
          if (!options.silent)
            alert('No highlighted differences found to capture.');
          return;
        }

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-10000px';
        tempContainer.style.top = '0';
        tempContainer.style.background = '#ffffff';
        tempContainer.style.color = '#111827';
        tempContainer.style.padding = '10px';
        tempContainer.style.boxSizing = 'border-box';

        const CAPTURE_WIDTH = 1500;
        tempContainer.style.width = `${CAPTURE_WIDTH}px`;

        const tempTable = document.createElement('table');
        tempTable.className = table.className;
        tempTable.style.borderCollapse = 'collapse';
        tempTable.style.width = '100%';
        tempTable.style.tableLayout = 'fixed';
        tempTable.style.fontFamily =
          '"Consolas","Menlo","Courier New",monospace';
        tempTable.style.fontSize = '11px';
        tempTable.style.lineHeight = '1.3';

        indices.forEach((idx) => {
          const cloneRow = allRows[idx].cloneNode(true);
          cloneRow.querySelectorAll('td, th').forEach((cell) => {
            cell.style.padding = '2px 6px';
            const className = (cell.className || '').toLowerCase();
            if (className.includes('gutter')) {
              cell.style.whiteSpace = 'nowrap';
              cell.style.wordBreak = 'keep-all';
              cell.style.minWidth = '30px';
              cell.style.width = '1%';
              cell.style.textAlign = 'right';
            } else {
              cell.style.wordBreak = 'break-word';
              cell.style.whiteSpace = 'pre-wrap';
            }
            const computedStyle = window.getComputedStyle(cell);
            cell.style.backgroundColor = computedStyle.backgroundColor;
            cell.style.color = computedStyle.color;
            cell.style.borderBottom =
              '1px solid rgba(148, 163, 184, 0.4)';
          });
          tempTable.appendChild(cloneRow);
        });

        tempContainer.appendChild(tempTable);
        document.body.appendChild(tempContainer);

        // Wait for fonts and layout to settle before capturing
        try {
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
          }
        } catch (e) {
          // ignore
        }
        await new Promise((res) =>
          requestAnimationFrame(() => requestAnimationFrame(res))
        );

        const canvas = await html2canvas(tempContainer, {
          backgroundColor: '#ffffff',
          scale: 1.2,
          width: CAPTURE_WIDTH,
          windowWidth: CAPTURE_WIDTH,
        });

        document.body.removeChild(tempContainer);

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((b) => {
            if (!b)
              return reject(
                new Error('Failed to convert canvas to Blob')
              );
            resolve(b);
          }, 'image/png');
        });

        if (!blob || blob.size === 0)
          throw new Error('Screenshot blob is empty');

        const componentName = getComponentName(filePath);

        // pass serverName through to backend
        const resp = await uploadDiffScreenshot(
          excelPath,
          fileName || 'diff',
          blob,
          componentName,
          serverName || ''
        );

        if (!options.silent)
          alert(resp.message || 'Screenshot added to Excel.');
      } catch (err) {
        console.warn('Error capturing diff screenshot:', err);

        const backendMessage =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to capture screenshot.';

        if (!options.silent) {
          alert(backendMessage);
        }

        throw new Error(backendMessage);
      }
    },
  }));

  const savedComments = (comments || []).filter(
    (c) => c.comment && c.comment.trim()
  );

  // Special status handlers
  if (status === 'added') {
    return (
      <div className="h-full flex flex-col bg-white">
        <SectionHeader
          icon={
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="New File"
          subtitle="This file exists only in the NEW version"
        />
        <div className="flex-1 p-4 overflow-auto">
          <textarea
            className="w-full h-full min-h-[400px] p-4 rounded-md border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            value={editableNewText}
            onChange={handleNewChange}
            placeholder="Edit NEW content..."
          />
        </div>
      </div>
    );
  }

  if (status === 'missing' || status === 'missing_new') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-8">
        <div className="mb-4 p-4 rounded-full bg-red-50 text-red-600 border border-red-100">
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          File deleted
        </h3>
        <p className="text-sm text-slate-600 text-center max-w-md">
          This file exists only in the OLD version. There is no NEW version
          to compare against.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-slate-200">
        {[
          {
            id: 'diff',
            label: 'Diff View',
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            ),
          },
          {
            id: 'edit',
            label: 'Edit',
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            ),
          },
          {
            id: 'comments',
            label: 'Comments',
            icon: (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            ),
            badge: savedComments.length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium
              ${
                activeTab === tab.id
                  ? 'bg-purple-50 text-purple-700 border border-purple-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge > 0 && <CommentBadge count={tab.badge} />}
          </button>
        ))}
      </div>

      {/* Diff View Tab */}
      {activeTab === 'diff' && (
        <div
          ref={containerRef}
          className="relative flex-1 overflow-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent"
        >
          <div ref={diffRef} className="min-h-full">
            <ReactDiffViewer
              oldValue={oldText || ''}
              newValue={editableNewText || ''}
              splitView
              useDarkTheme={false}
              styles={diffStyles}
              showDiffOnly={false}
              onLineNumberClick={handleLineNumberClick}
              leftTitle={
                <div className="flex items-center gap-2 px-4 py-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    OLD
                  </span>
                  <span className="text-slate-500">Read-only</span>
                </div>
              }
              rightTitle={
                <div className="flex items-center gap-2 px-4 py-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-medium">
                    NEW
                  </span>
                  <span className="text-purple-700">
                    Click line numbers to add comments
                  </span>
                </div>
              }
            />
          </div>

          {/* Comment Popover */}
          {activeLine != null && popoverTop != null && (
            <div
              className="absolute right-4 w-80 z-50"
              style={{ top: popoverTop }}
            >
              <div className="relative bg-white border border-slate-200 rounded-md shadow-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      Line {activeLine}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClosePopover}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Line Preview */}
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
                    Code preview
                  </p>
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 max-h-16 overflow-y-auto">
                    {(editableNewText || '').split('\n')[activeLine - 1] ||
                      '(empty line)'}
                  </div>
                </div>

                {/* Comment Input */}
                <div className="p-4">
                  <textarea
                    className="w-full h-24 p-3 rounded-md bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Add your comment about this change..."
                    value={tempComment}
                    onChange={(e) => setTempComment(e.target.value)}
                    autoFocus
                  />

                  <div className="flex items-center justify-between mt-3">
                    <button
                      type="button"
                      onClick={handleSaveComment}
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      Save comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Tab */}
      {activeTab === 'edit' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden bg-white">
          <div className="flex-1 relative">
            <textarea
              className="absolute inset-0 w-full h-full p-4 rounded-md bg-white border border-slate-300 text-slate-900 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 scrollbar-thin"
              value={editableNewText}
              onChange={handleNewChange}
              placeholder="Edit the NEW content here..."
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Lines: {(editableNewText || '').split('\n').length}</span>
            <span>Characters: {(editableNewText || '').length}</span>
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="flex-1 overflow-auto p-4 bg-white scrollbar-thin scrollbar-thumb-purple-300">
          {savedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4 p-4 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                No comments yet
              </h3>
              <p className="text-sm text-slate-500 max-w-md">
                Click on line numbers in the Diff View to add comments about
                specific changes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedComments.map((c, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-md bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50"
                >
                  {/* Left accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600" />

                  <div className="pl-5 pr-4 py-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-[10px] font-bold bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                          Line {c.lineNumber}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onCommentChange &&
                          onCommentChange(c.lineNumber, '', '')
                        }
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"
                        title="Delete comment"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Code Preview */}
                    {c.lineContent && (
                      <div className="mb-3 p-2 rounded-md bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto">
                        {c.lineContent}
                      </div>
                    )}

                    {/* Comment */}
                    <p className="text-sm text-slate-900">{c.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DiffViewer;