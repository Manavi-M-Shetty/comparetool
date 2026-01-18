import React, { useState } from 'react';

export default function WorkspaceModal({ onCreate, onSelect, workspaces, onClose }) {
  const [mode, setMode] = useState(null); // 'create' or 'select'
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (newName.trim()) {
      console.log('handleCreate called with:', newName.trim());
      try {
        await onCreate(newName.trim());
        console.log('onCreate succeeded, closing modal');
        onClose();
      } catch (e) {
        console.error('Failed to create workspace:', e);
        alert('Failed to create workspace: ' + (e.message || e));
      }
    } else {
      alert('Please enter a workspace name');
    }
  };

  const handleSelect = async (name) => {
    console.log('handleSelect called with:', name);
    try {
      await onSelect(name);
      console.log('onSelect succeeded, closing modal');
      onClose();
    } catch (e) {
      console.error('Failed to select workspace:', e);
      alert('Failed to select workspace: ' + (e.message || e));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Select or Create Workspace</h2>
        {!mode && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create New Workspace
            </button>
            <button
              onClick={() => setMode('select')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Open Existing Workspace
            </button>
          </div>
        )}
        {mode === 'create' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Workspace name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => setMode(null)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Back
              </button>
            </div>
          </div>
        )}
        {mode === 'select' && (
          <div className="space-y-4">
            {workspaces.length === 0 ? (
              <p className="text-gray-500">No workspaces available</p>
            ) : (
              <ul className="space-y-2">
                {workspaces.map((ws) => (
                  <li key={ws}>
                    <button
                      onClick={() => handleSelect(ws)}
                      className="w-full text-left px-3 py-2 border rounded hover:bg-gray-100"
                    >
                      {ws}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setMode(null)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}