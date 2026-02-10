// frontend/src/components/FolderTree.jsx
/**
 * Hierarchical folder/file tree component for displaying comparison results.
 * 
 * Features:
 * - Expandable folder structure
 * - Visual status indicators (modified, new, deleted)
 * - File selection and navigation
 * - Comment badge display
 * - Missing file highlighting
 */

import React, { useState } from 'react';

// File Icon Component
function FileIcon({ status, className = '' }) {
  if (status === 'missing') {
    return (
      <svg
        className={`w-4 h-4 ${className}`}
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
    );
  }
  if (status === 'new') {
    return (
      <svg
        className={`w-4 h-4 ${className}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  }
  if (status === 'modified') {
    return (
      <svg
        className={`w-4 h-4 ${className}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    );
  }
  // Default file icon
  return (
    <svg
      className={`w-4 h-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const configs = {
    missing: {
      label: 'DELETED',
      className: 'bg-red-100 text-red-800 border-red-300',
      dot: 'bg-red-500',
    },
    new: {
      label: 'NEW',
      className: 'bg-purple-100 text-purple-800 border-purple-300',
      dot: 'bg-purple-500',
    },
    // modified highlight (amber/orange)
    modified: {
      label: 'MODIFIED',
      className: 'bg-amber-100 text-amber-800 border-amber-300',
      dot: 'bg-amber-500',
    },
    identical: {
      label: null,
      className: '',
      dot: '',
    },
  };

  const config = configs[status];
  if (!config || !config.label) {
    return (
      <svg
        className="w-3.5 h-3.5 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// Folder Icon Component
function FolderIcon({ isOpen, hasChanges }) {
  const color = hasChanges ? 'text-purple-600' : 'text-slate-500';
  if (isOpen) {
    return (
      <svg
        className={`w-4 h-4 transition-colors ${color}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z"
          clipRule="evenodd"
        />
        <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
      </svg>
    );
  }
  return (
    <svg
      className={`w-4 h-4 transition-colors ${color}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

export default function FolderTree({
  title = 'Folder Results',
  tree = null,
  onFileSelect,
  search = '',
  missingOldFiles = [],
  missingNewFiles = [],
  validationMap = {},
  onToggleValidation = () => {},
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileStatus = (fd) => {
    if (!fd) return null;

    if (
      fd.summary === 'Missing in NEW' ||
      fd.missing_side === 'NEW' ||
      (fd.old_path && !fd.new_path)
    ) {
      return 'missing';
    }
    if (fd.missing_side === 'OLD' || (fd.new_path && !fd.old_path)) {
      return 'new';
    }
    if (fd.has_changes === true) {
      return 'modified';
    }
    if (fd.has_changes === false) {
      return 'identical';
    }
    return null;
  };

  const getStatusConfig = (status) => {
    const configs = {
      missing: {
        iconColor: 'text-red-600',
        hoverBg: 'hover:bg-red-50',
        textColor: 'text-red-700',
        activeBg: 'bg-red-50',
      },
      new: {
        iconColor: 'text-purple-600',
        hoverBg: 'hover:bg-purple-50',
        textColor: 'text-purple-700',
        activeBg: 'bg-purple-50',
      },
      modified: {
        iconColor: 'text-amber-600',
        hoverBg: 'hover:bg-amber-50',
        textColor: 'text-amber-700',
        activeBg: 'bg-amber-50',
      },
      identical: {
        iconColor: 'text-slate-500',
        hoverBg: 'hover:bg-slate-50',
        textColor: 'text-slate-700',
        activeBg: '',
      },
    };
    return configs[status] || configs.identical;
  };

  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
        <div className="p-3 rounded-full bg-purple-50 text-purple-600 mb-3 border border-purple-100">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <p className="text-xs text-slate-500">No matched files found</p>
      </div>
    );
  }

  const matchesSearch = (name) => {
    if (!search) return true;
    return (name || '').toLowerCase().includes(search.toLowerCase());
  };

  const folderHasMatch = (node) => {
    if (matchesSearch(node.name)) return true;
    if ((node.files || []).some((f) => matchesSearch(f.file_name))) return true;
    if ((node.subfolders || []).some((sf) => folderHasMatch(sf))) return true;
    return false;
  };

  const folderHasChanges = (node) => {
    if (
      (node.files || []).some(
        (f) => f.has_changes || f.summary === 'Missing in NEW'
      )
    )
      return true;
    if ((node.subfolders || []).some((sf) => folderHasChanges(sf))) return true;
    return false;
  };

  const countChanges = (node) => {
    let count = 0;
    (node.files || []).forEach((f) => {
      if (f.has_changes || f.summary === 'Missing in NEW') count++;
    });
    (node.subfolders || []).forEach((sf) => {
      count += countChanges(sf);
    });
    return count;
  };

  // Render file row
  const renderFileRow = (fd, i) => {
    const status = getFileStatus(fd);
    const config = getStatusConfig(status);
    const filePath = fd.old_path || fd.path || fd.new_path || '';
    const validated = validationMap[filePath] || false;
    const isMissingInNew = fd.summary === 'Missing in NEW';

    return (
      <div
        key={i}
        className={`
          group relative flex items-center gap-2 px-2 py-1.5 rounded-md
          cursor-pointer transition-colors
          ${config.hoverBg} ${status === 'missing' ? config.activeBg : ''}
          border border-transparent hover:border-purple-300
        `}
        onClick={() => onFileSelect && onFileSelect(fd)}
      >
        {/* Left accent line for modified/missing */}
        {(status === 'modified' || status === 'missing') && (
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full ${
              status === 'modified' ? 'bg-amber-500' : 'bg-red-500'
            }`}
          />
        )}

        {/* File Icon */}
        <FileIcon status={status} className={config.iconColor} />

        {/* File Name */}
        <span
          className={`flex-1 text-xs truncate ${config.textColor}`}
          title={fd.file_name}
        >
          {fd.file_name}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Validation Checkbox */}
          {isMissingInNew && (
            <label
              className="relative flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={validated}
                onChange={(e) =>
                  onToggleValidation(filePath, e.target.checked)
                }
                className="sr-only peer"
              />
              <div
                className={`
                  w-4 h-4 rounded border-2 flex items-center justify-center
                  transition-colors cursor-pointer
                  ${
                    validated
                      ? 'bg-purple-600 border-purple-500'
                      : 'bg-transparent border-slate-400 hover:border-purple-500'
                  }
                `}
              >
                {validated && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </label>
          )}

          {/* Status Badge */}
          <StatusBadge status={status} />
        </div>
      </div>
    );
  };

  // Render folder
  const renderFolder = (node, depth = 0) => {
    if (!folderHasMatch(node)) return null;

    const isOpen = expandedFolders.has(node.path) || depth === 0;
    const hasChanges = folderHasChanges(node);
    const changeCount = countChanges(node);

    return (
      <div key={node.path} className="select-none">
        {/* Folder Header */}
        <div
          onClick={() => toggleFolder(node.path)}
          className={`
            group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
            transition-colors hover:bg-slate-50
          `}
        >
          {/* Chevron */}
          <svg
            className={`w-3 h-3 text-slate-500 transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>

          {/* Folder Icon */}
          <FolderIcon isOpen={isOpen} hasChanges={hasChanges} />

          {/* Folder Name */}
          <span
            className={`flex-1 text-xs font-medium truncate ${
              hasChanges ? 'text-purple-700' : 'text-slate-700'
            }`}
          >
            {node.name}
          </span>

          {/* Change Count Badge */}
          {changeCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {changeCount}
            </span>
          )}
        </div>

        {/* Folder Contents */}
        {isOpen && (
          <div className="ml-3 pl-3 border-l border-slate-200 space-y-0.5 mt-0.5">
            {/* Files */}
            {(node.files || []).map((fd, i) => {
              if (
                !matchesSearch(fd.file_name || '') &&
                !matchesSearch(node.name || '')
              )
                return null;
              return renderFileRow(fd, i);
            })}

            {/* Subfolders */}
            {(node.subfolders || []).map((sub) =>
              renderFolder(sub, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Render "New Files" section
  const renderOnlyInNew = () => {
    if (!missingNewFiles || missingNewFiles.length === 0) return null;
    const getFileName = (p) =>
      (p || '').split(/[/\\]/).filter(Boolean).slice(-1)[0] || p;

    return (
      <div className="mb-4">
        <details className="group" open>
          <summary className="flex items-center gap-2 px-2 py-2.5 rounded-md cursor-pointer list-none bg-slate-50 border border-purple-200 hover:bg-slate-100">
            {/* Chevron */}
            <svg
              className="w-3 h-3 text-purple-500 transition-transform group-open:rotate-90"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>

            {/* Icon */}
            <div className="p-1 rounded-md bg-purple-50 text-purple-700">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>

            {/* Title */}
            <span className="flex-1 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              New files
            </span>

            {/* Count */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {missingNewFiles.length}
            </span>
          </summary>

          <div className="mt-2 ml-2 pl-3 border-l border-slate-200 space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300">
            {missingNewFiles.map((m, idx) => {
              const validated = validationMap[m.file_path] || false;
              const fileName = getFileName(m.file_path);

              return (
                <div
                  key={idx}
                  className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() =>
                    onFileSelect &&
                    onFileSelect({
                      file_name: fileName,
                      old_path: null,
                      new_path: m.file_path,
                      component_name: m.component_name,
                      summary: 'Missing in OLD',
                      has_changes: true,
                      missing_side: 'OLD',
                    })
                  }
                >
                  {/* Icon */}
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 truncate">
                      {fileName}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate">
                      {m.component_name}
                    </p>
                  </div>

                  {/* Checkbox */}
                  <label
                    className="relative flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={validated}
                      onChange={(e) =>
                        onToggleValidation(m.file_path, e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center
                        transition-colors cursor-pointer
                        ${
                          validated
                            ? 'bg-purple-600 border-purple-500'
                            : 'bg-transparent border-slate-400 hover:border-purple-500'
                        }
                      `}
                    >
                      {validated && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </label>

                  {/* Badge */}
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    NEW
                  </span>
                </div>
              );
            })}
          </div>
        </details>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent pb-20">
      {/* New Files Section */}
      {renderOnlyInNew()}

      {/* Folder Tree */}
      <div className="space-y-0.5">{renderFolder(tree)}</div>
    </div>
  );
}