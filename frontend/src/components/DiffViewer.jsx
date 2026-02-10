// frontend/src/components/DiffViewer.jsx
/**
 * Side-by-side diff viewer component with integrated commenting and screenshot capture.
 *
 * Features:
 * - Syntax-highlighted diff display using react-diff-viewer
 * - Line-by-line comments with count badges
 * - Screenshot capture and Excel upload capabilities
 * - Semantic diff summary display
 * - Status management (modified, validated, etc.)
 */

import React,
{
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
import { useTheme } from '../context/ThemeContext';

// Light + dark theme styles for ReactDiffViewer
const diffStyles = {
  variables: {
    light: { /* same as before */ },
    dark:  { /* same as before */ },
  },
  line: {
    padding: '2px 0',
    fontSize: '12px',
    lineHeight: '1.6',
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    // no explicit color here – let react-diff-viewer use diffViewerColor
  },
  gutter: {
    minWidth: '50px',
    padding: '0 12px',
    cursor: 'pointer',
  },
  contentText: {
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    // no explicit color here either
  }
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
    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 dark:bg-purple-900/40 dark:border-purple-700/60 dark:text-purple-200">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
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
    serverName = '',
    onReady,
  },
  ref
) {
  const { theme } = useTheme();

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

        try {
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
          }
        } catch {
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
      <div className="h-full flex flex-col bg-white dark:bg-slate-900">
        <SectionHeader
          icon={
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
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="New comparison file"
          subtitle="This file exists only in the comparison folder"
        />
        <div className="flex-1 p-4 overflow-auto">
          <textarea
            className="w-full h-full min-h-[400px] p-4 rounded-md border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600"
            value={editableNewText}
            onChange={handleNewChange}
            placeholder="Edit comparison content..."
          />
        </div>
      </div>
    );
  }

  if (status === 'missing' || status === 'missing_new') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-8 dark:bg-slate-900">
        <div className="mb-4 p-4 rounded-full bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700/60">
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
        <h3 className="text-lg font-semibold text-slate-900 mb-2 dark:text-slate-50">
          File deleted from comparison
        </h3>
        <p className="text-sm text-slate-600 text-center max-w-md dark:text-slate-300">
          This file exists only in the baseline folder. There is no
          comparison version to display.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden dark:bg-slate-900">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        {[
          {
            id: 'diff',
            label: 'Diff view',
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
            label: 'Edit comparison',
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
                  ? 'bg-purple-50 text-purple-700 border border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-500/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800'
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
          className="relative flex-1 overflow-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent dark:scrollbar-thumb-purple-500"
        >
          <div ref={diffRef} className="min-h-full">
            <ReactDiffViewer
              oldValue={oldText || ''}
              newValue={editableNewText || ''}
              splitView
              useDarkTheme={theme === 'dark'}
              styles={diffStyles}
              showDiffOnly={false}
              onLineNumberClick={handleLineNumberClick}
              leftTitle={
                <div className="flex items-center gap-2 px-4 py-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium dark:bg-slate-800 dark:text-slate-100">
                    BASELINE
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Read only
                  </span>
                </div>
              }
              rightTitle={
                <div className="flex items-center gap-2 px-4 py-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-medium">
                    COMPARISON
                  </span>
                  <span className="text-purple-700 dark:text-purple-300">
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
              <div className="relative bg-white border border-slate-200 rounded-md shadow-md overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
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
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Line {activeLine}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClosePopover}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
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
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 dark:text-slate-400">
                    Code preview
                  </p>
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 max-h-16 overflow-y-auto dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                    {(editableNewText || '').split('\n')[activeLine - 1] ||
                      '(empty line)'}
                  </div>
                </div>

                {/* Comment Input */}
                <div className="p-4">
                  <textarea
                    className="w-full h-24 p-3 rounded-md bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600 dark:placeholder-slate-500"
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
        <div className="flex-1 flex flex-col p-4 overflow-hidden bg-white dark:bg-slate-900">
          <div className="flex-1 relative">
            <textarea
              className="absolute inset-0 w-full h-full p-4 rounded-md bg-white border border-slate-300 text-slate-900 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 scrollbar-thin dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600"
              value={editableNewText}
              onChange={handleNewChange}
              placeholder="Edit the comparison content here..."
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Lines: {(editableNewText || '').split('\n').length}</span>
            <span>Characters: {(editableNewText || '').length}</span>
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="flex-1 overflow-auto p-4 bg-white scrollbar-thin scrollbar-thumb-purple-300 dark:bg-slate-900 dark:scrollbar-thumb-purple-500">
          {savedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4 p-4 rounded-full bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700/60">
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
              <h3 className="text-base font-semibold text-slate-900 mb-2 dark:text-slate-50">
                No comments yet
              </h3>
              <p className="text-sm text-slate-500 max-w-md dark:text-slate-400">
                Click on line numbers in the Diff view to add comments about
                specific changes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedComments.map((c, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-md bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-purple-500/60"
                >
                  {/* Left accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 dark:bg-purple-500" />

                  <div className="pl-5 pr-4 py-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-[10px] font-bold bg-purple-50 text-purple-700 rounded-md border border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700/60">
                          Line {c.lineNumber}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onCommentChange &&
                          onCommentChange(c.lineNumber, '', '')
                        }
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-300 dark:hover:bg-red-900/30"
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
                      <div className="mb-3 p-2 rounded-md bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                        {c.lineContent}
                      </div>
                    )}

                    {/* Comment */}
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {c.comment}
                    </p>
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