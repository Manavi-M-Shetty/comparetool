export default function FolderTree({ title = 'Folder Results', tree = null, onFileSelect, search = '' }) {
  // tree: nested FolderNode { name, path, subfolders, files }

  const statusLabel = (fd) => {
    if (!fd) return { text: 'Unknown', className: 'text-gray-600' };
    if (fd.summary === 'Missing in NEW') return { text: 'Missing', className: 'text-red-600' };
    if (fd.has_changes === true) return { text: 'Modified', className: 'text-yellow-700' };
    if (fd.has_changes === false) return { text: 'Identical', className: 'text-green-700' };
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
    return name.toLowerCase().includes(search.toLowerCase());
  };

  const folderHasMatch = (node) => {
    if (matchesSearch(node.name)) return true;
    if ((node.files || []).some(f => matchesSearch(f.file_name))) return true;
    if ((node.subfolders || []).some(sf => folderHasMatch(sf))) return true;
    return false;
  };

  const renderFolder = (node) => {
    if (!folderHasMatch(node)) return null;
    return (
      <details key={node.path} className="mb-2" open>
        <summary className="font-semibold cursor-pointer">{node.name}</summary>
        <div className="ml-3 border-l border-gray-200 pl-2 mt-1 space-y-0.5">
          {(node.files || []).map((fd, i) => {
            if (!matchesSearch(fd.file_name) && !matchesSearch(node.name)) return null;
            const st = statusLabel(fd);
            return (
              <button
                key={i}
                onClick={() => onFileSelect && onFileSelect(fd)}
                className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${st.className}`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{fd.file_name}</span>
                  <span className="ml-2 text-[11px] font-medium">{st.text}</span>
                </div>
                {fd.summary && (
                  <div className="text-[11px] text-gray-500 mt-0.5">{fd.summary}</div>
                )}
              </button>
            );
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

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-bold mb-2 text-gray-700">{title}</h3>
      <div className="h-80 overflow-auto space-y-1 text-xs">
        {renderFolder(tree)}
      </div>
    </div>
  );
}
