// frontend/src/components/WorkspaceSidebar.jsx
import React, { useState } from 'react';
import { useComparison } from '../context/ComparisonContext';

export default function WorkspaceSidebar() {
  const {
    currentWorkspace,
    workspaces,
    createNewWorkspace,
    switchWorkspace,
    deleteWorkspace,
  } = useComparison();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    e.stopPropagation();
    const ok = window.confirm(
      `Are you sure you want to delete workspace "${name}"? This cannot be undone.`
    );
    if (!ok) return;
    await deleteWorkspace(name);
  };

  const selectedName = currentWorkspace?.name || null;

  return (
    <div 
      className={`
        relative flex flex-col h-screen z-30
        bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-purple-950/90
        backdrop-blur-2xl border-r border-purple-500/10
        shadow-[4px_0_24px_-2px_rgba(147,51,234,0.15)]
        transition-all duration-300 ease-out
        ${isCollapsed ? 'w-16' : 'w-72'}
      `}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5 pointer-events-none" />
      
      {/* Animated accent line */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-purple-500/50 via-pink-500/20 to-transparent" />

      {/* Header */}
      <div className="relative px-4 py-5 border-b border-purple-500/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              {/* Logo icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 rounded-lg blur-md opacity-40" />
                <div className="relative p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Workspaces
                </h2>
                <p className="text-[10px] text-purple-400/70 font-medium">
                  {workspaces?.length || 0} available
                </p>
              </div>
            </div>
          )}
          
          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Workspace list */}
      <div className="relative flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
        {(!workspaces || workspaces.length === 0) ? (
          <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
            <div className="flex flex-col items-center justify-center py-8 px-4">
              {/* Empty state illustration */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl" />
                <div className="relative p-4 bg-purple-500/10 rounded-full border border-purple-500/20">
                  <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-300 text-center mb-1">
                No workspaces yet
              </p>
              <p className="text-xs text-gray-500 text-center">
                Create your first workspace to get started
              </p>
            </div>
          </div>
        ) : (
          workspaces?.map((wsItem, index) => {
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
                className="group relative animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active glow effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl blur-lg" />
                )}
                
                <div
                  className={`
                    relative flex items-center gap-3 px-3 py-3 rounded-xl
                    transition-all duration-200 cursor-pointer
                    ${isActive
                      ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg shadow-purple-900/30 border border-purple-400/20'
                      : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  {/* Workspace icon */}
                  <div className={`
                    relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    ${isActive 
                      ? 'bg-white/20' 
                      : 'bg-purple-500/10 group-hover:bg-purple-500/20'
                    }
                    transition-colors
                  `}>
                    <span className={`
                      text-sm font-bold
                      ${isActive ? 'text-white' : 'text-purple-400'}
                    `}>
                      {name.charAt(0).toUpperCase()}
                    </span>
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-purple-600 shadow-lg shadow-green-400/50" />
                    )}
                  </div>

                  {!isCollapsed && (
                    <>
                      {/* Workspace name and status */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}>
                          {name}
                        </p>
                        {isActive && (
                          <p className="text-[10px] text-purple-200/70 font-medium">
                            Currently active
                          </p>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        title="Delete workspace"
                        className={`
                          p-1.5 rounded-lg transition-all duration-200
                          opacity-0 group-hover:opacity-100
                          ${isActive 
                            ? 'hover:bg-white/10 text-purple-200 hover:text-white' 
                            : 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                          }
                        `}
                        onClick={(e) => handleDelete(name, e)}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create new workspace */}
      <div className="relative px-3 py-4 border-t border-purple-500/10 bg-black/20">
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className={`
              w-full rounded-xl font-semibold
              transition-all duration-300 transform hover:-translate-y-0.5
              bg-gradient-to-r from-purple-600 to-pink-600
              hover:from-purple-500 hover:to-pink-500
              text-white shadow-lg shadow-purple-900/40
              hover:shadow-purple-900/60
              ${isCollapsed ? 'p-3' : 'px-4 py-3 text-sm'}
              flex items-center justify-center gap-2
            `}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {!isCollapsed && <span>New Workspace</span>}
          </button>
        ) : (
          <div className={`space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
            {/* Input container with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-md" />
              <input
                type="text"
                placeholder="Enter workspace name..."
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewName('');
                  }
                }}
                className="
                  relative w-full px-4 py-3 rounded-xl text-sm
                  bg-slate-900/80 border border-purple-500/30
                  text-white placeholder-gray-500
                  focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20
                  transition-all
                "
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="
                  flex-1 px-4 py-2.5 text-sm font-medium rounded-xl
                  bg-gradient-to-r from-purple-600 to-pink-600
                  hover:from-purple-500 hover:to-pink-500
                  text-white transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:hover:from-purple-600 disabled:hover:to-pink-600
                  flex items-center justify-center gap-2
                "
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
                className="
                  px-4 py-2.5 text-sm font-medium rounded-xl
                  bg-gray-800 hover:bg-gray-700
                  text-gray-300 hover:text-white
                  transition-colors border border-gray-700 hover:border-gray-600
                "
              >
                Cancel
              </button>
            </div>
            
            {/* Helper text */}
            <p className="text-[10px] text-gray-500 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">Enter</kbd> to create or <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">Esc</kbd> to cancel
            </p>
          </div>
        )}
      </div>

      {/* Bottom decorative gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-950/50 to-transparent pointer-events-none" />
    </div>
  );
}