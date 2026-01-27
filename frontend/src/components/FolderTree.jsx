// frontend/src/components/FolderTree.jsx
import React from 'react';

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
  
  // Helper to determine status style and text
  const getFileStatus = (fd) => {
    if (!fd) return null;

    // 1. Missing in NEW
    if (
      fd.summary === 'Missing in NEW' ||
      fd.missing_side === 'NEW' ||
      (fd.old_path && !fd.new_path)
    ) {
      return { 
        label: 'MISSING', 
        colorClass: 'text-red-300 bg-red-900/30 border-red-500/30', 
        iconColor: 'text-red-400' 
      };
    }

    // 2. New (Missing in OLD)
    if (fd.missing_side === 'OLD' || (fd.new_path && !fd.old_path)) {
      return { 
        label: 'NEW', 
        colorClass: 'text-emerald-300 bg-emerald-900/30 border-emerald-500/30', 
        iconColor: 'text-emerald-400' 
      };
    }

    // 3. Modified
    if (fd.has_changes === true) {
      return { 
        label: 'MOD', 
        colorClass: 'text-amber-300 bg-amber-900/30 border-amber-500/30', 
        iconColor: 'text-amber-400' 
      };
    }

    // 4. Identical (has_changes === false)
    if (fd.has_changes === false) {
      return { 
        label: 'SAME', 
        colorClass: 'text-slate-500 bg-slate-800 border-slate-700 opacity-60', 
        iconColor: 'text-slate-600',
        isIdentical: true
      };
    }

    return null;
  };

  if (!tree) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">No matched files found.</p>
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
    const status = getFileStatus(fd);
    const filePath = fd.old_path || fd.path || fd.new_path || '';
    const validated = validationMap[filePath] || false;
    const isMissingInNew = fd.summary === 'Missing in NEW';

    return (
      <div
        key={i}
        className={`group w-full text-left px-2 py-1.5 rounded transition-all cursor-pointer flex items-center justify-between border border-transparent ${
          isMissingInNew ? 'bg-red-900/10 hover:bg-red-900/20' : 'hover:bg-white/5'
        }`}
        onClick={() => onFileSelect && onFileSelect(fd)}
      >
        <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
            {/* File Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${status?.iconColor || 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            
            <span className={`text-xs truncate ${isMissingInNew ? 'text-red-300' : 'text-gray-300 group-hover:text-white'}`} title={fd.file_name}>
                {fd.file_name}
            </span>
        </div>

        <div className="flex items-center gap-2 pl-2 flex-shrink-0">
            {/* Review Checkbox (only for missing files) */}
            {isMissingInNew && (
              <input
                  type="checkbox"
                  checked={validated}
                  onClick={(e) => e.stopPropagation()} 
                  onChange={(e) => onToggleValidation(filePath, e.target.checked)}
                  className="h-3 w-3 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                  title="Mark as reviewed"
              />
            )}
            
            {/* Status Badge */}
            {status && (
                status.isIdentical ? (
                    // Subtle checkmark for identical
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-600 opacity-50" viewBox="0 0 20 20" fill="currentColor" title="Identical">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                ) : (
                    // Text Badge for MOD / NEW / MISSING
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${status.colorClass}`}>
                        {status.label}
                    </span>
                )
            )}
        </div>
      </div>
    );
  };

  const renderFolder = (node) => {
    if (!folderHasMatch(node)) return null;

    return (
      <details key={node.path} className="mb-0.5" open>
        <summary className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 hover:text-purple-300 transition-colors py-1.5 px-1 rounded hover:bg-white/5 select-none list-none group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400/70 group-hover:text-purple-400 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="truncate font-semibold">{node.name}</span>
        </summary>
        <div className="ml-2.5 border-l border-white/5 pl-1.5 mt-0.5 space-y-0.5">
          {(node.files || []).map((fd, i) => {
            if (!matchesSearch(fd.file_name || '') && !matchesSearch(node.name || '')) return null;
            return renderFileRow(fd, i);
          })}
          {(node.subfolders || []).map((sub) => (
            <div key={sub.path}>{renderFolder(sub)}</div>
          ))}
        </div>
      </details>
    );
  };

  // Render files that exist only in NEW - AS A DROPDOWN
  const renderOnlyInNew = () => {
    if (!missingNewFiles || missingNewFiles.length === 0) return null;
    const getFileName = (p) => (p || '').split(/[/\\]/).filter(Boolean).slice(-1)[0] || p;

    return (
      <details className="mb-2 group border-b border-white/5 pb-2">
        <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold uppercase tracking-wide text-emerald-400/80 hover:text-emerald-400 transition-colors py-2 px-2 hover:bg-white/5 rounded select-none list-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>New Files (Missing in Old)</span>
            <span className="ml-auto bg-emerald-900/30 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded-full">
                {missingNewFiles.length}
            </span>
        </summary>
        
        <div className="ml-3 pl-2 border-l border-emerald-500/10 mt-1 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
          {missingNewFiles.map((m, idx) => {
            const validated = validationMap[m.file_path] || false;
            const fileName = getFileName(m.file_path);

            return (
              <div
                key={idx}
                className="group/item flex items-center justify-between px-2 py-1.5 rounded hover:bg-emerald-900/10 cursor-pointer transition-colors"
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
                <div className="flex items-center gap-2 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-500/50" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    <div className="truncate">
                        <div className="text-xs text-gray-300 group-hover/item:text-emerald-200">{fileName}</div>
                        <div className="text-[9px] text-gray-500 group-hover/item:text-gray-400 truncate">{m.component_name}</div>
                    </div>
                </div>
                
                <input
                    type="checkbox"
                    checked={validated}
                    onClick={(e) => e.stopPropagation()} 
                    onChange={(e) => onToggleValidation(m.file_path, e.target.checked)}
                    className="h-3 w-3 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-0 ml-2 cursor-pointer"
                    title="Mark as reviewed"
                />
              </div>
            );
          })}
        </div>
      </details>
    );
  };

  return (
    <div className="h-full pb-10">
      {renderOnlyInNew()}
      <div className="space-y-0.5 text-xs">
        {renderFolder(tree)}
      </div>
    </div>
  );
}