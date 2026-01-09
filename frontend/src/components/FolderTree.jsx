export default function FolderTree({ title, files, onFileSelect }) {
  if (!files || files.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-bold mb-2 text-gray-700">{title}</h3>
        <p className="text-sm text-gray-500">No files found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-bold mb-2 text-gray-700">{title}</h3>
      <div className="h-80 overflow-auto space-y-1">
        {files.map((file, i) => (
          <div
            key={i}
            className={`text-sm p-2 rounded cursor-pointer transition-colors ${
              onFileSelect
                ? "hover:bg-blue-100 text-blue-700"
                : "text-gray-700"
            }`}
            onClick={() => onFileSelect && onFileSelect(file)}
          >
            {typeof file === "string" ? file : file.path || file.name}
          </div>
        ))}
      </div>
    </div>
  );
}
