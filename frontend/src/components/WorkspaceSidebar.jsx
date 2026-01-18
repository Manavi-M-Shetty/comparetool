// frontend/src/components/WorkspaceSidebar.jsx
import React, { useState } from 'react';
import { useComparison } from '../context/ComparisonContext';

export default function WorkspaceSidebar() {
  const {
    currentWorkspace,
    workspaces,
    createNewWorkspace,
    switchWorkspace,
  } = useComparison();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const getName = (ws) =>
    typeof ws === 'string' ? ws : ws?.name || '';

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createNewWorkspace(trimmed);
    setNewName('');
    setIsCreating(false);
  };

  const handleSwitch = async (name) => {
    if (!name) return;
    // avoid reloading if already selected
    if (currentWorkspace && currentWorkspace.name === name) return;
    await switchWorkspace(name);
  };

  const selectedName = currentWorkspace?.name || null;

  return (
    <div className="w-64 bg-gray-900 text-gray-100 flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
          Workspaces
        </h2>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {(!workspaces || workspaces.length === 0) && (
          <div className="text-xs text-gray-500 px-2 py-2">
            No workspaces yet.
            <br />
            Create one below.
          </div>
        )}

        {workspaces?.map((wsItem) => {
          const name = getName(wsItem);
          if (!name) return null;
          const isActive = name === selectedName;
          return (
            <button
              key={name}
              onClick={() => handleSwitch(name)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{name}</span>
                {isActive && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-blue-100">
                    current
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Create new workspace */}
      <div className="px-3 py-3 border-t border-gray-800">
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-3 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            + New workspace
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Workspace name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-2 py-1 rounded-md text-sm text-gray-900 border border-gray-300 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
                className="px-3 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}