// frontend/src/components/WorkspaceSidebar.jsx
/**
 * Left sidebar for workspace and environment/server selection.
 * 
 * Features:
 * - Create new workspaces
 * - Select workspaces and view their configuration
 * - Add/manage environments and servers
 * - Delete workspaces with confirmation
 * - Collapsible sidebar for better space utilization
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComparison } from '../context/ComparisonContext';
import {
  getWorkspace as apiGetWorkspace,
  updateWorkspace as apiUpdateWorkspace,
} from '../utils/api';

export default function WorkspaceSidebar() {
  const {
    currentWorkspace,
    workspaces,
    createNewWorkspace,
    switchWorkspace,
    deleteWorkspace,
    updateCurrentWorkspace,
    selectEnvServer,
    selectedEnv,        // 👈 NEW: for highlighting selected server
    selectedServer,     // 👈 NEW
  } = useComparison();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [expandedWorkspace, setExpandedWorkspace] = useState(null);
  const [workspaceMeta, setWorkspaceMeta] = useState({});

  const [envModalOpen, setEnvModalOpen] = useState(false);
  const [envWorkspaceName, setEnvWorkspaceName] = useState('');
  const [envInput, setEnvInput] = useState('');

  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [serverWorkspaceName, setServerWorkspaceName] = useState('');
  const [serverEnvName, setServerEnvName] = useState('');
  const [serverInput, setServerInput] = useState('');

  const navigate = useNavigate();

  const getName = (ws) =>
    typeof ws === 'string' ? ws : ws?.name || '';

  const getCurrentName = () =>
    typeof currentWorkspace === 'string'
      ? currentWorkspace
      : currentWorkspace?.name || null;

  useEffect(() => {
    if (currentWorkspace?.name) {
      setExpandedWorkspace((prev) => prev || currentWorkspace.name);
      setWorkspaceMeta((prev) => ({
        ...prev,
        [currentWorkspace.name]: currentWorkspace,
      }));
    }
  }, [currentWorkspace?.name]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createNewWorkspace(trimmed);
    setNewName('');
    setIsCreating(false);
  };

  const handleWorkspaceClick = async (name) => {
    setExpandedWorkspace((prev) => (prev === name ? null : name));

    if (!workspaceMeta[name]) {
      try {
        const meta = await apiGetWorkspace(name);
        setWorkspaceMeta((prev) => ({ ...prev, [name]: meta }));
      } catch (e) {
        console.error('Failed to load workspace metadata', e);
      }
    }
  };

  const handleDelete = async (name, e) => {
    e.stopPropagation();
    const ok = window.confirm(
      `Are you sure you want to delete workspace "${name}"? This cannot be undone.`
    );
    if (!ok) return;
    await deleteWorkspace(name);
    setWorkspaceMeta((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const getMetaForWorkspace = (name) => {
    if (currentWorkspace && currentWorkspace.name === name) {
      return currentWorkspace;
    }
    return workspaceMeta[name] || null;
  };

  const handleAddEnvironment = async (workspaceName, envName) => {
    const meta = getMetaForWorkspace(workspaceName);
    if (!meta) {
      alert('Workspace metadata not loaded yet.');
      return;
    }

    const trimmed = envName.trim();
    if (!trimmed) return;

    const existingEnvs = meta.environments || [];
    if (existingEnvs.some((e) => e.name === trimmed)) {
      alert('Environment with this name already exists.');
      return;
    }

    const updatedEnvs = [...existingEnvs, { name: trimmed, servers: [] }];

    try {
      if (currentWorkspace && currentWorkspace.name === workspaceName) {
        await updateCurrentWorkspace({ environments: updatedEnvs });
      } else {
        await apiUpdateWorkspace(workspaceName, { environments: updatedEnvs });
      }

      setWorkspaceMeta((prev) => ({
        ...prev,
        [workspaceName]: { ...(meta || {}), environments: updatedEnvs },
      }));
    } catch (e) {
      console.error('Failed to add environment', e);
      alert('Failed to add environment.');
    }
  };

  const handleAddServer = async (workspaceName, envName, serverName) => {
    const meta = getMetaForWorkspace(workspaceName);
    if (!meta) {
      alert('Workspace metadata not loaded yet.');
      return;
    }

    const trimmed = serverName.trim();
    if (!trimmed) return;

    const existingEnvs = meta.environments || [];
    const updatedEnvs = existingEnvs.map((env) => {
      if (env.name !== envName) return env;
      const servers = env.servers || [];
      if (servers.some((s) => s.name === trimmed)) {
        alert(
          'Server with this name already exists in this environment.'
        );
        return env;
      }
      return {
        ...env,
        servers: [...servers, { name: trimmed }],
      };
    });

    try {
      if (currentWorkspace && currentWorkspace.name === workspaceName) {
        await updateCurrentWorkspace({ environments: updatedEnvs });
      } else {
        await apiUpdateWorkspace(workspaceName, { environments: updatedEnvs });
      }

      setWorkspaceMeta((prev) => ({
        ...prev,
        [workspaceName]: { ...(meta || {}), environments: updatedEnvs },
      }));
    } catch (e) {
      console.error('Failed to add server', e);
      alert('Failed to add server.');
    }
  };

  const startAddEnvironment = (workspaceName) => {
    setEnvWorkspaceName(workspaceName);
    setEnvInput('');
    setEnvModalOpen(true);
  };

  const startAddServer = (workspaceName, envName) => {
    setServerWorkspaceName(workspaceName);
    setServerEnvName(envName);
    setServerInput('');
    setServerModalOpen(true);
  };

  const confirmAddEnvironment = async () => {
    const value = envInput.trim();
    if (!value) return;
    await handleAddEnvironment(envWorkspaceName, value);
    setEnvModalOpen(false);
  };

  const confirmAddServer = async () => {
    const value = serverInput.trim();
    if (!value) return;
    await handleAddServer(serverWorkspaceName, serverEnvName, value);
    setServerModalOpen(false);
  };

  const handleServerClick = async (workspaceName, envName, serverName) => {
    if (!workspaceName || !envName || !serverName) return;

    if (!currentWorkspace || currentWorkspace.name !== workspaceName) {
      await switchWorkspace(workspaceName);
    }
    selectEnvServer(envName, serverName);
    navigate('/'); // Upload route
  };

  const selectedName = getCurrentName();

  return (
    <>
      <div
        className={`relative flex flex-col h-screen border-r border-slate-200 bg-white text-slate-900 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        {/* Header */}
        <div className="px-3 py-3 border-b border-slate-200 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-600 text-white">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="leading-tight">
                <h2 className="text-sm font-semibold text-slate-900">
                  Workspaces
                </h2>
                <p className="text-[11px] text-slate-500">
                  {workspaces?.length || 0} available
                </p>
              </div>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Workspace list */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
          {(!workspaces || workspaces.length === 0) ? (
            !isCollapsed && (
              <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
                <div className="mb-3 flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-1">
                  No workspaces yet
                </p>
                <p className="text-xs text-slate-500">
                  Create your first workspace to get started.
                </p>
              </div>
            )
          ) : (
            workspaces.map((wsItem) => {
              const name = getName(wsItem);
              if (!name) return null;

              const isActive =
                currentWorkspace && currentWorkspace.name === name;
              const isSelected = name === selectedName;
              const isExpanded = expandedWorkspace === name;
              const meta = getMetaForWorkspace(name);

              return (
                <div key={name} className="space-y-1">
                  {/* Workspace row */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleWorkspaceClick(name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleWorkspaceClick(name);
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-xs md:text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${
                      isSelected
                        ? 'bg-purple-50 border border-purple-200 text-purple-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>

                    {!isCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`truncate ${
                              isSelected ? 'font-semibold' : 'font-medium'
                            }`}
                          >
                            {name}
                          </p>
                          {isActive && (
                            <p className="text-[11px] text-purple-500">
                              Active workspace
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          title="Delete workspace"
                          onClick={(e) => handleDelete(name, e)}
                          className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Env & servers for this workspace */}
                  {!isCollapsed && isExpanded && (
                    <div className="ml-8 mt-1 mb-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Environments
                        </span>
                        <button
                          type="button"
                          onClick={() => startAddEnvironment(name)}
                          className="text-[11px] text-purple-600 hover:text-purple-800"
                        >
                          + Add env
                        </button>
                      </div>

                      {!(meta && meta.environments && meta.environments.length) ? (
                        <p className="text-[11px] text-slate-400">
                          No environments yet. Click &quot;+ Add env&quot; to
                          create one.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {(meta.environments || []).map((env) => (
                            <div
                              key={env.name}
                              className="border border-slate-200 rounded-md bg-slate-50"
                            >
                              <div className="flex items-center justify-between px-2 py-1.5">
                                <span className="text-xs font-semibold text-slate-700">
                                  {env.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    startAddServer(name, env.name)
                                  }
                                  className="text-[11px] text-purple-600 hover:text-purple-800"
                                >
                                  + Server
                                </button>
                              </div>
                              <div className="pl-3 pr-2 pb-1">
                                {(env.servers || []).length === 0 ? (
                                  <p className="text-[11px] text-slate-400">
                                    No servers yet.
                                  </p>
                                ) : (
                                  <ul className="space-y-1">
                                    {(env.servers || []).map((srv) => {
                                      const isServerSelected =
                                        currentWorkspace &&
                                        currentWorkspace.name === name &&
                                        selectedEnv === env.name &&
                                        selectedServer === srv.name;

                                      return (
                                        <li key={srv.name}>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleServerClick(
                                                name,
                                                env.name,
                                                srv.name
                                              )
                                            }
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs md:text-sm font-medium
                                              ${
                                                isServerSelected
                                                  ? 'bg-purple-100 text-purple-900 border-purple-400'
                                                  : 'bg-white text-slate-800 border-transparent hover:bg-slate-100 hover:border-slate-200'
                                              }`}
                                          >
                                            <span
                                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold ${
                                                isServerSelected
                                                  ? 'bg-purple-600 text-white'
                                                  : 'bg-slate-200 text-slate-700'
                                              }`}
                                            >
                                              S
                                            </span>
                                            <span className="truncate">
                                              {srv.name}
                                            </span>
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Create new workspace */}
        <div className="px-3 py-3 border-t border-slate-200 bg-slate-50">
          {!isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className={`w-full flex items-center justify-center gap-2 rounded-md bg-purple-600 text-white text-xs md:text-sm font-medium px-3 py-2 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/70 ${
                isCollapsed ? 'px-0' : ''
              }`}
            >
              <svg
                className="w-4 h-4"
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
              {!isCollapsed && <span>New Workspace</span>}
            </button>
          ) : (
            !isCollapsed && (
              <div className="space-y-2">
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
                  className="w-full px-3 py-2 rounded-md text-sm bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 text-white text-xs md:text-sm font-medium px-3 py-2 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/70"
                  >
                    <svg
                      className="w-4 h-4"
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
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setNewName('');
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 text-xs md:text-sm font-medium px-3 py-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-[10px] text-slate-500">
                  Press Enter to create or Esc to cancel.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Environment Name Modal */}
      {envModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              New Environment
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Workspace: <span className="font-mono">{envWorkspaceName}</span>
            </p>
            <input
              type="text"
              autoFocus
              value={envInput}
              onChange={(e) => setEnvInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddEnvironment();
                if (e.key === 'Escape') setEnvModalOpen(false);
              }}
              placeholder="e.g., LAB, SIT, UAT"
              className="w-full px-3 py-2 mb-3 rounded-md border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEnvModalOpen(false)}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddEnvironment}
                disabled={!envInput.trim()}
                className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-60"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Name Modal */}
      {serverModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              New Server
            </h3>
            <p className="text-xs text-slate-500 mb-1">
              Workspace: <span className="font-mono">{serverWorkspaceName}</span>
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Environment: <span className="font-mono">{serverEnvName}</span>
            </p>
            <input
              type="text"
              autoFocus
              value={serverInput}
              onChange={(e) => setServerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddServer();
                if (e.key === 'Escape') setServerModalOpen(false);
              }}
              placeholder="e.g., server1"
              className="w-full px-3 py-2 mb-3 rounded-md border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setServerModalOpen(false)}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddServer}
                disabled={!serverInput.trim()}
                className="px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-60"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}