// frontend/src/components/WorkspaceSidebar.jsx
import React, { useState } from 'react';
import { useComparison } from '../context/ComparisonContext';

export default function WorkspaceSidebar() {
  const {
    currentWorkspace,
    workspaces,
    createNewWorkspace,
    switchWorkspace,
    deleteWorkspace,        // from context
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
    if (currentWorkspace && currentWorkspace.name === name) return;
    await switchWorkspace(name);
  };

  const handleDelete = async (name, e) => {
    // prevent row click (which would switch workspace)
    e.stopPropagation();
    const ok = window.confirm(
      `Are you sure you want to delete workspace "${name}"? This cannot be undone.`
    );
    if (!ok) return;
    await deleteWorkspace(name);
  };

  const selectedName = currentWorkspace?.name || null;

  return (
    // Sidebar Container: Glass effect + Dark Purple
    <div className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col h-screen shadow-2xl z-30">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-black/10">
        <h2 className="text-xs font-bold tracking-widest text-purple-300 uppercase drop-shadow-sm">
          Workspaces
        </h2>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 custom-scrollbar">
        {(!workspaces || workspaces.length === 0) && (
          <div className="text-xs text-gray-500 px-2 py-2 text-center border border-dashed border-gray-700 rounded-lg">
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
            <div
              key={name}
              role="button"
              tabIndex={0}
              onClick={() => handleSwitch(name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSwitch(name);
                }
              }}
              className={`group w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between cursor-pointer border ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-lg shadow-purple-900/50'
                  : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white hover:border-white/5'
              }`}
            >
              <div className="flex-1 min-w-0 flex items-center">
                 {/* Little indicator dot */}
                <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${isActive ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-gray-600 group-hover:bg-gray-400'}`}></div>
                <span className="truncate font-medium">{name}</span>
                {isActive && (
                  <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-purple-100 bg-black/20 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>

              {/* Delete button */}
              <button
                type="button"
                title="Delete workspace"
                className={`ml-2 p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ${isActive ? 'text-purple-200 hover:text-white' : ''}`}
                onClick={(e) => handleDelete(name, e)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Create new workspace */}
      <div className="px-4 py-4 border-t border-white/10 bg-black/20">
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full px-4 py-2.5 text-sm rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-900/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>+</span> New Workspace
          </button>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <input
              type="text"
              placeholder="Workspace name"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-gray-900/50 border border-gray-600 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
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