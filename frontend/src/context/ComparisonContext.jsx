// frontend/src/context/ComparisonContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  compareFolders as apiCompareFolders,
  compareAndUpdate as apiCompareAndUpdate,
  compareFilePaths,
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  deleteWorkspace as apiDeleteWorkspace,
  updateWorkspace as apiUpdateWorkspace,
} from '../utils/api';

const SESSION_PREFIX = 'compare_session_v1_';

const ComparisonContext = createContext(null);
export const useComparison = () => useContext(ComparisonContext);

// 🔑 session per workspace + env + server
function getSessionKey(workspaceName, envName, serverName) {
  const ws = workspaceName || 'defaultWs';
  const env = envName || 'defaultEnv';
  const srv = serverName || 'defaultServer';
  return `${SESSION_PREFIX}${ws}__${env}__${srv}`;
}

export function ComparisonProvider({ children }) {
  const [oldFolder, setOldFolder] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [excelPath, setExcelPath] = useState('');
  const [folderResult, setFolderResult] = useState(null);
  const [missingValidations, setMissingValidations] = useState({});
  const [comments, setComments] = useState({});
  const [editedFiles, setEditedFiles] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({ type: 'info', message: 'Ready' });
  const [restored, setRestored] = useState(false);

  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);

  // 🧩 current environment & server (your “active unit”)
  const [selectedEnv, setSelectedEnv] = useState('');
  const [selectedServer, setSelectedServer] = useState('');

  const saveTimer = useRef(null);
  const navigate = useNavigate();

  // Helper: save session for given ws/env/server
  const saveSessionFor = (
    workspaceName,
    envName,
    serverName,
    dataOverride = null
  ) => {
    if (!workspaceName) return;
    const key = getSessionKey(workspaceName, envName, serverName);
    const obj =
      dataOverride ||
      {
        oldFolder,
        newFolder,
        excelPath,
        folderResult,
        missingValidations,
        comments,
        editedFiles,
      };
    try {
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save session', key, e);
    }
  };

  // Initial load: workspaces + last selected workspace
  useEffect(() => {
    loadWorkspaces();
    const savedWs = localStorage.getItem('current_workspace');
    if (savedWs) {
      selectWorkspace(savedWs);
    }
  }, []);

   useEffect(() => {
    if (!currentWorkspace) return;

    // Only restore when BOTH environment and server are selected.
    // This prevents an intermediate restore for [ - / - ].
    if (!selectedEnv || !selectedServer) {
      return;
    }

    try {
      const key = getSessionKey(
        currentWorkspace.name,
        selectedEnv,
        selectedServer
      );
      const raw = localStorage.getItem(key);

      if (raw) {
        const obj = JSON.parse(raw);

        setOldFolder(obj.oldFolder ?? '');
        setNewFolder(obj.newFolder ?? '');
        setExcelPath(obj.excelPath ?? '');
        setFolderResult(obj.folderResult || null);
        setMissingValidations(obj.missingValidations || {});
        setComments(obj.comments || {});
        setEditedFiles(obj.editedFiles || {});
        setSelectedFile(null);
        setRestored(true);
        setStatus({
          type: 'info',
          message: `Restored session for ${currentWorkspace.name} [${selectedEnv} / ${selectedServer}]`,
        });
      } else {
        // Fresh state for this specific server
        setOldFolder('');
        setNewFolder('');
        setExcelPath('');
        setFolderResult(null);
        setMissingValidations({});
        setComments({});
        setEditedFiles({});
        setSelectedFile(null);
        setRestored(false);
        setStatus({
          type: 'info',
          message: `Ready for ${currentWorkspace.name} [${selectedEnv} / ${selectedServer}]`,
        });
      }
    } catch (e) {
      console.warn(
        'Failed to restore session for',
        currentWorkspace?.name,
        selectedEnv,
        selectedServer,
        e
      );
    }
  }, [currentWorkspace?.name, selectedEnv, selectedServer]);
  
  // Restore session per workspace + env + server
  useEffect(() => {
    if (!currentWorkspace) return;

    try {
      const key = getSessionKey(
        currentWorkspace.name,
        selectedEnv,
        selectedServer
      );
      const raw = localStorage.getItem(key);

      if (raw) {
        const obj = JSON.parse(raw);

        setOldFolder(obj.oldFolder ?? '');
        setNewFolder(obj.newFolder ?? '');
        setExcelPath(obj.excelPath ?? '');
        setFolderResult(obj.folderResult || null);
        setMissingValidations(obj.missingValidations || {});
        setComments(obj.comments || {});
        setEditedFiles(obj.editedFiles || {});
        setSelectedFile(null);
        setRestored(true);
        setStatus({
          type: 'info',
          message: `Restored session for ${currentWorkspace.name} [${selectedEnv || '-'} / ${selectedServer || '-'}]`,
        });
      } else {
        // Fresh state for this server
        setOldFolder('');
        setNewFolder('');
        setExcelPath('');
        setFolderResult(null);
        setMissingValidations({});
        setComments({});
        setEditedFiles({});
        setSelectedFile(null);
        setRestored(false);
        setStatus({
          type: 'info',
          message: `Ready for ${currentWorkspace.name} [${selectedEnv || '-'} / ${selectedServer || '-'}]`,
        });
      }
    } catch (e) {
      console.warn(
        'Failed to restore session for',
        currentWorkspace?.name,
        selectedEnv,
        selectedServer,
        e
      );
    }
  }, [currentWorkspace?.name, selectedEnv, selectedServer]);

  // Auto-save per workspace + env + server every 30s AND immediately on any change
  useEffect(() => {
    if (!currentWorkspace) return;

    if (saveTimer.current) {
      clearInterval(saveTimer.current);
    }

    const key = getSessionKey(
      currentWorkspace.name,
      selectedEnv,
      selectedServer
    );

    const save = () => {
      try {
        const obj = {
          oldFolder,
          newFolder,
          excelPath,
          folderResult,
          missingValidations,
          comments,
          editedFiles,
        };
        localStorage.setItem(key, JSON.stringify(obj));
      } catch (e) {
        console.warn('Auto-save failed', e);
      }
    };

    // ⏱ save immediately whenever dependencies change
    save();
    saveTimer.current = setInterval(save, 30_000);

    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, [
    currentWorkspace?.name,
    selectedEnv,
    selectedServer,
    oldFolder,
    newFolder,
    excelPath,
    folderResult,
    missingValidations,
    comments,
    editedFiles,
  ]);

  // Save current server session on browser unload
  useEffect(() => {
    const handler = () => {
      if (!currentWorkspace) return;
      try {
        const key = getSessionKey(
          currentWorkspace.name,
          selectedEnv,
          selectedServer
        );
        const obj = {
          oldFolder,
          newFolder,
          excelPath,
          folderResult,
          missingValidations,
          comments,
          editedFiles,
        };
        localStorage.setItem(key, JSON.stringify(obj));
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [
    currentWorkspace?.name,
    selectedEnv,
    selectedServer,
    oldFolder,
    newFolder,
    excelPath,
    folderResult,
    missingValidations,
    comments,
    editedFiles,
  ]);

  const clearSession = () => {
    // Clears only the current workspace+env+server saved session and in-memory state
    if (currentWorkspace) {
      const key = getSessionKey(
        currentWorkspace.name,
        selectedEnv,
        selectedServer
      );
      localStorage.removeItem(key);
    }
    setOldFolder('');
    setNewFolder('');
    setExcelPath('');
    setFolderResult(null);
    setMissingValidations({});
    setComments({});
    setEditedFiles({});
    setSelectedFile(null);
    setStatus({ type: 'info', message: 'Ready' });
  };

  const runFolderCompare = async (oldF, newF) => {
    if (!currentWorkspace) {
      setStatus({ type: 'error', message: 'No workspace selected' });
      return;
    }
    setStatus({ type: 'info', message: 'Comparing folders...' });
    try {
      const data = await apiCompareFolders(
        oldF,
        newF,
        currentWorkspace.name
      );
      setFolderResult(data);

      // initialize validations map
      const newValidationMap = { ...missingValidations };
      (data.old_only_files || []).forEach((m) => {
        if (!(m.file_path in newValidationMap))
          newValidationMap[m.file_path] = false;
      });
      (data.new_only_files || []).forEach((m) => {
        if (!(m.file_path in newValidationMap))
          newValidationMap[m.file_path] = false;
      });
      setMissingValidations(newValidationMap);

      setOldFolder(oldF);
      setNewFolder(newF);

      setStatus({
        type: 'success',
        message: `Compared ${data.total_components} components. Found changes in ${data.components_with_changes} components.`,
      });
      navigate('/results');
      return data;
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e.message ||
        'Error during folder compare';
      setStatus({ type: 'error', message: msg });
      throw e;
    }
  };

  const runCompareAndUpdate = async (
    missingValidationsList = [],
    commentsObj = {}
  ) => {
    if (!currentWorkspace) {
      setStatus({ type: 'error', message: 'No workspace selected' });
      return;
    }
    setStatus({
      type: 'info',
      message: 'Comparing and updating Excel...',
    });
    try {
      const res = await apiCompareAndUpdate(
        oldFolder,
        newFolder,
        excelPath,
        missingValidationsList,
        commentsObj,
        currentWorkspace.name
      );
      if (res.comparison) {
        setFolderResult(res.comparison);
        navigate('/results');
      }
      if (res.excel_update && res.excel_update.success) {
        setStatus({
          type: 'success',
          message: `Excel updated: ${res.excel_update.message}`,
        });
      } else if (res.excel_update) {
        setStatus({
          type: 'error',
          message: res.excel_update.message,
        });
      } else {
        setStatus({
          type: 'success',
          message:
            'Compare completed (Excel not requested or failed)',
        });
      }
      return res;
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e.message ||
        'Error during compare and update';
      setStatus({ type: 'error', message: msg });
      throw e;
    }
  };

  const fetchFileDiff = async (oldPath, newPath) => {
    try {
      const d = await compareFilePaths(oldPath, newPath);
      return d;
    } catch (e) {
      throw e;
    }
  };

  const loadWorkspaces = async () => {
    try {
      const ws = await listWorkspaces();
      setWorkspaces(ws);
    } catch (e) {
      console.error('Failed to load workspaces', e);
    }
  };

  const createNewWorkspace = async (name) => {
    console.log('Creating workspace:', name);
    const ws = await createWorkspace(name, '', '', '');
    console.log('Workspace created:', ws);
    setCurrentWorkspace(ws);
    setWorkspaces((prev) => [...prev, name]);
    localStorage.setItem('current_workspace', name);

    // fresh paths for new workspace
    setOldFolder('');
    setNewFolder('');
    setExcelPath('');

    await loadWorkspaces();
  };

  const selectWorkspace = async (name) => {
    try {
      // save current workspace+env+server session before switching
      if (currentWorkspace) {
        saveSessionFor(
          currentWorkspace.name,
          selectedEnv,
          selectedServer
        );
      }
      const ws = await getWorkspace(name);
      setCurrentWorkspace(ws);
      localStorage.setItem('current_workspace', name);
    } catch (e) {
      setStatus({
        type: 'error',
        message: 'Failed to load workspace',
      });
    }
  };

  const switchWorkspace = async (name) => {
    console.log('Switching workspace to:', name);
    await selectWorkspace(name);
  };

  const selectEnvServer = (envName, serverName) => {
    // save current server session before switching
    if (currentWorkspace) {
      saveSessionFor(
        currentWorkspace.name,
        selectedEnv,
        selectedServer
      );
    }
    setSelectedEnv(envName || '');
    setSelectedServer(serverName || '');
  };

  const deleteWorkspace = async (name) => {
    try {
      await apiDeleteWorkspace(name);

      // Remove all sessions for this workspace (all env/server combinations)
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`${SESSION_PREFIX}${name}__`)) {
          localStorage.removeItem(key);
        }
      });

      if (currentWorkspace && currentWorkspace.name === name) {
        setCurrentWorkspace(null);
        localStorage.removeItem('current_workspace');
        setOldFolder('');
        setNewFolder('');
        setExcelPath('');
        setFolderResult(null);
        setMissingValidations({});
        setComments({});
        setEditedFiles({});
        setSelectedFile(null);
        setSelectedEnv('');
        setSelectedServer('');
      }

      await loadWorkspaces();
      setStatus({
        type: 'success',
        message: `Workspace "${name}" deleted`,
      });
    } catch (e) {
      console.error('Failed to delete workspace', e);
      setStatus({
        type: 'error',
        message: 'Failed to delete workspace',
      });
    }
  };

  const updateCurrentWorkspace = async (updates) => {
    if (!currentWorkspace) return null;
    try {
      const ws = await apiUpdateWorkspace(currentWorkspace.name, updates);
      setCurrentWorkspace(ws);
      await loadWorkspaces();
      return ws;
    } catch (e) {
      console.error('Failed to update workspace', e);
      setStatus({
        type: 'error',
        message: 'Failed to update workspace',
      });
      throw e;
    }
  };

  const setComment = (filePath, key, comment) => {
    setComments((c) => {
      const updated = { ...(c || {}) };
      updated[filePath] = {
        ...(updated[filePath] || {}),
        [key]: comment,
      };
      return updated;
    });
  };

  const setEditedContent = (filePath, content) => {
    setEditedFiles((m) => ({ ...(m || {}), [filePath]: content }));
  };

  const value = {
    oldFolder,
    setOldFolder,
    newFolder,
    setNewFolder,
    excelPath,
    setExcelPath,
    folderResult,
    setFolderResult,
    missingValidations,
    setMissingValidations,
    comments,
    setComments,
    setComment,
    editedFiles,
    setEditedFiles,
    setEditedContent,
    selectedFile,
    setSelectedFile,
    status,
    setStatus,
    restored,
    clearSession,
    runFolderCompare,
    runCompareAndUpdate,
    fetchFileDiff,
    loadWorkspaces,
    createNewWorkspace,
    selectWorkspace,
    switchWorkspace,
    currentWorkspace,
    setCurrentWorkspace,
    workspaces,
    setWorkspaces,
    deleteWorkspace,
    updateCurrentWorkspace,
    selectedEnv,
    selectedServer,
    selectEnvServer,
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export default ComparisonContext;