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
} from '../utils/api';

const SESSION_PREFIX = 'compare_session_v1_';

const ComparisonContext = createContext(null);
export const useComparison = () => useContext(ComparisonContext);

function getSessionKey(workspaceName) {
  return `${SESSION_PREFIX}${workspaceName || 'default'}`;
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

  const saveTimer = useRef(null);
  const navigate = useNavigate();

  // Initial load: workspaces + last selected workspace
  useEffect(() => {
    loadWorkspaces();
    const savedWs = localStorage.getItem('current_workspace');
    if (savedWs) {
      selectWorkspace(savedWs);
    }
  }, []);

  // Restore session per workspace when currentWorkspace changes
  useEffect(() => {
    if (!currentWorkspace) return;

    try {
      const key = getSessionKey(currentWorkspace.name);
      const raw = localStorage.getItem(key);

      if (raw) {
        const obj = JSON.parse(raw);

        setOldFolder(
          obj.oldFolder ?? currentWorkspace.old_folder ?? ''
        );
        setNewFolder(
          obj.newFolder ?? currentWorkspace.new_folder ?? ''
        );
        setExcelPath(
          obj.excelPath ?? currentWorkspace.excel_path ?? ''
        );
        setFolderResult(obj.folderResult || null);
        setMissingValidations(obj.missingValidations || {});
        setComments(obj.comments || {});
        setEditedFiles(obj.editedFiles || {});
        setSelectedFile(null);
        setRestored(true);
        setStatus({
          type: 'info',
          message: `Restored previous review session for workspace "${currentWorkspace.name}"`,
        });
      } else {
        // No saved session => start fresh for this workspace, using its metadata
        setOldFolder(currentWorkspace.old_folder || '');
        setNewFolder(currentWorkspace.new_folder || '');
        setExcelPath(currentWorkspace.excel_path || '');
        setFolderResult(null);
        setMissingValidations({});
        setComments({});
        setEditedFiles({});
        setSelectedFile(null);
        setRestored(false);
        setStatus({
          type: 'info',
          message: `Ready in workspace "${currentWorkspace.name}"`,
        });
      }
    } catch (e) {
      console.warn(
        'Failed to restore session for workspace',
        currentWorkspace.name,
        e
      );
    }
  }, [currentWorkspace?.name]);

  // Auto-save per workspace every 30s
  useEffect(() => {
    if (!currentWorkspace) return;

    if (saveTimer.current) {
      clearInterval(saveTimer.current);
    }

    const key = getSessionKey(currentWorkspace.name);

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

    saveTimer.current = setInterval(save, 30_000);

    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, [
    currentWorkspace?.name,
    oldFolder,
    newFolder,
    excelPath,
    folderResult,
    missingValidations,
    comments,
    editedFiles,
  ]);

  // Save current workspace session on browser unload
  useEffect(() => {
    const handler = () => {
      if (!currentWorkspace) return;
      try {
        const key = getSessionKey(currentWorkspace.name);
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
    oldFolder,
    newFolder,
    excelPath,
    folderResult,
    missingValidations,
    comments,
    editedFiles,
  ]);

  const clearSession = () => {
    // Clears only the current workspace's saved session and in-memory state
    if (currentWorkspace) {
      localStorage.removeItem(getSessionKey(currentWorkspace.name));
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
      const ws = await getWorkspace(name);
      setCurrentWorkspace(ws);
      // workspace metadata is set here; session restore effect may override
      setOldFolder(ws.old_folder || '');
      setNewFolder(ws.new_folder || '');
      setExcelPath(ws.excel_path || '');
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
    // Do NOT clear global state; selectWorkspace + session restore will handle it
    await selectWorkspace(name);
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
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export default ComparisonContext;