// frontend/src/components/FolderTree.jsx
import React from 'react';

export default function FolderTree({
  title = 'Folder Results',
  tree = null,
  onFileSelect,
  search = '',
  missingOldFiles = [],       // currently not used, but kept for future
  missingNewFiles = [],
  validationMap = {},
  onToggleValidation = () => {},
}) {
  // tree: nested FolderNode { name, path, subfolders, files }

  const statusLabel = (fd) => {
    if (!fd) return { text: 'Unknown', className: 'text-gray-600' };

    // If summary explicitly marks it as missing in NEW
    if (
      fd.summary === 'Missing in NEW' ||
      fd.missing_side === 'NEW' ||
      (fd.old_path && !fd.new_path)
    ) {
      return { text: 'Missing (NEW)', className: 'text-red-600' };
    }

    // If file exists only in NEW
    if (fd.missing_side === 'OLD' || (fd.new_path && !fd.old_path)) {
      return { text: 'Only in NEW', className: 'text-indigo-700' };
    }

    // Matched files
    if (fd.has_changes === true)
      return { text: 'Modified', className: 'text-yellow-700' };
    if (fd.has_changes === false)
      return { text: 'Identical', className: 'text-green-700' };

    return { text: 'Unknown', className: 'text-gray-600' };
  };

  if (!tree) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-bold mb-2 text-gray-700">{title}</h3>
        <p className="text-sm text-gray-500">No matched files.</p>
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

  // Render one file row inside the tree
  const renderFileRow = (fd, i) => {
    const st = statusLabel(fd);
    const filePath = fd.old_path || fd.path || fd.new_path || '';
    const validated = validationMap[filePath] || false;
    const isMissingInNew = fd.summary === 'Missing in NEW';

    return (
      <div
        key={i}
        className={`block w-full text-left px-2 py-1 rounded ${
          isMissingInNew ? 'bg-red-50' : ''
        } ${st.className}`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFileSelect && onFileSelect(fd)}
              className="text-left"
            >
              <span
                className={`${
                  isMissingInNew ? 'font-semibold' : 'font-medium'
                }`}
              >
                {fd.file_name}
              </span>
              {fd.summary && (
                <span className="ml-2 text-[11px] text-gray-500">
                  {fd.summary}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isMissingInNew && (
              <label className="flex items-center text-xs gap-1">
                <input
                  type="checkbox"
                  checked={validated}
                  onChange={(e) =>
                    onToggleValidation(filePath, e.target.checked)
                  }
                />
                <span className="text-gray-600 ml-1">Reviewed</span>
              </label>
            )}
            <span className="ml-2 text-[11px] font-medium">{st.text}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderFolder = (node) => {
    // Skip entire folder if nothing matches search
    if (!folderHasMatch(node)) return null;

    return (
      <details key={node.path} className="mb-2" open>
        <summary className="font-semibold cursor-pointer text-xs text-slate-800">
          {node.name}
        </summary>
        <div className="ml-3 border-l border-gray-200 pl-2 mt-1 space-y-0.5">
          {(node.files || []).map((fd, i) => {
            if (
              !matchesSearch(fd.file_name || '') &&
              !matchesSearch(node.name || '')
            )
              return null;
            return renderFileRow(fd, i);
          })}

          {(node.subfolders || []).map((sub) => (
            <div key={sub.path} className="mt-2">
              {renderFolder(sub)}
            </div>
          ))}
        </div>
      </details>
    );
  };

  // Render files that exist only in NEW (those missing on OLD side)
  const renderOnlyInNew = () => {
    if (!missingNewFiles || missingNewFiles.length === 0) return null;

    const getFileName = (p) =>
      (p || '').split(/[/\\]/).filter(Boolean).slice(-1)[0] || p;

    return (
      <div className="mb-3">
        <h4 className="font-semibold text-sm text-gray-700">
          Files present only in NEW
        </h4>
        <div className="text-xs mt-2 space-y-1">
          {missingNewFiles.map((m, idx) => {
            const validated = validationMap[m.file_path] || false;
            const fileName = getFileName(m.file_path);

            return (
              <div
                key={idx}
                className="flex items-center justify-between px-2 py-1 rounded bg-white hover:bg-indigo-50 cursor-pointer"
                // 🔹 Make NEW-only files openable in diff viewer
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
                <div>
                  <div className="font-medium">{fileName}</div>
                  <div className="text-[11px] text-gray-500">
                    {m.component_name} — missing in OLD
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label
                    className="flex items-center text-xs gap-1"
                    onClick={(e) => e.stopPropagation()} // don't trigger row click
                  >
                    <input
                      type="checkbox"
                      checked={validated}
                      onChange={(e) =>
                        onToggleValidation(m.file_path, e.target.checked)
                      }
                    />
                    <span className="text-gray-600 ml-1">Reviewed</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-bold mb-2 text-gray-700">{title}</h3>

      {/* NEW-only files (bold, clickable) */}
      {renderOnlyInNew()}

      {/* Normal folder tree (includes OLD-only + matched files) */}
      <div className="h-64 overflow-auto space-y-1 text-xs">
        {renderFolder(tree)}
      </div>
    </div>
  );
}