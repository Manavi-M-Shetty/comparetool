// frontend/src/components/WorkspaceModal.jsx
import React, { useState } from 'react';

export default function WorkspaceModal({ onCreate, onSelect, workspaces, onClose }) {
  const [mode, setMode] = useState(null); // 'create' or 'select'
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (newName.trim()) {
      try {
        await onCreate(newName.trim());
        onClose();
      } catch (e) {
        alert('Failed to create workspace: ' + (e.message || e));
      }
    } else {
      alert('Please enter a workspace name');
    }
  };

  const handleSelect = async (name) => {
    try {
      await onSelect(name);
      onClose();
    } catch (e) {
      alert('Failed to select workspace: ' + (e.message || e));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
        <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Welcome to Config Compare
        </h2>
        
        {!mode && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-purple-900/40 transition-all transform hover:-translate-y-0.5"
            >
              Create New Workspace
            </button>
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-700"></div>
            </div>
            <button
              onClick={() => setMode('select')}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg transition-colors"
            >
              Open Existing Workspace
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
             <div className="text-sm text-gray-400 text-center mb-2">
                Give your new workspace a name
             </div>
            <input
              type="text"
              placeholder="e.g. Project Alpha"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-600"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setMode(null)}
                className="flex-1 px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-semibold shadow-lg shadow-purple-900/30"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {mode === 'select' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 text-center mb-2">
                Select a workspace to resume
             </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {workspaces.length === 0 ? (
                <p className="text-gray-500 text-center py-4 italic">No saved workspaces found.</p>
              ) : (
                <ul className="space-y-2">
                  {workspaces.map((ws) => (
                    <li key={ws}>
                      <button
                        onClick={() => handleSelect(ws)}
                        className="w-full text-left px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700 hover:border-gray-500 text-gray-200 transition-all"
                      >
                        {ws}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setMode(null)}
              className="w-full mt-2 px-4 py-2 bg-transparent border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}