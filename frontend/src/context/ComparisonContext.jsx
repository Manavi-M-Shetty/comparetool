import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { compareFolders as apiCompareFolders, compareAndUpdate as apiCompareAndUpdate, compareFilePaths, updateExcel, compareFilesUpload } from "../utils/api";

const STORAGE_KEY = "compare_session_v1";

const ComparisonContext = createContext(null);

export const useComparison = () => useContext(ComparisonContext);

export function ComparisonProvider({ children }) {
  const [oldFolder, setOldFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [excelPath, setExcelPath] = useState("");
  const [folderResult, setFolderResult] = useState(null);
  const [missingValidations, setMissingValidations] = useState({});
  const [comments, setComments] = useState({}); // { file_path: { key: comment } }
  const [editedFiles, setEditedFiles] = useState({}); // { file_path: updated_content }
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({ type: "info", message: "Ready" });
  const [restored, setRestored] = useState(false);

  const saveTimer = useRef(null);
  const navigate = useNavigate();

  // Restore session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        setOldFolder(obj.oldFolder || "");
        setNewFolder(obj.newFolder || "");
        setExcelPath(obj.excelPath || "");
        setFolderResult(obj.folderResult || null);
        setMissingValidations(obj.missingValidations || {});
        setComments(obj.comments || {});
        setEditedFiles(obj.editedFiles || {});
        setRestored(true);
        setStatus({ type: "info", message: "Restored previous review session" });
      }
    } catch (e) {
      console.warn("Failed to restore session", e);
    }
  }, []);

  // Auto-save every 30s
  useEffect(() => {
    saveTimer.current = setInterval(() => {
      try {
        const obj = { oldFolder, newFolder, excelPath, folderResult, missingValidations, comments, editedFiles };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch (e) {
        console.warn("Auto-save failed", e);
      }
    }, 30_000);

    return () => {
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, [oldFolder, newFolder, excelPath, folderResult, missingValidations, comments, editedFiles]);

  // Save on unload / navigation
  useEffect(() => {
    const handler = () => {
      try {
        const obj = { oldFolder, newFolder, excelPath, folderResult, missingValidations, comments, editedFiles };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [oldFolder, newFolder, excelPath, folderResult, missingValidations, comments, editedFiles]);

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOldFolder("");
    setNewFolder("");
    setExcelPath("");
    setFolderResult(null);
    setMissingValidations({});
    setComments({});
    setEditedFiles({});
    setSelectedFile(null);
    setStatus({ type: "info", message: "Ready" });
  };

  const runFolderCompare = async (oldF, newF) => {
    setStatus({ type: "info", message: "Comparing folders..." });
    try {
      const data = await apiCompareFolders(oldF, newF);
      setFolderResult(data);

      // initialize validations map
      const newValidationMap = { ...missingValidations };
      (data.old_only_files || []).forEach((m) => {
        if (!(m.file_path in newValidationMap)) newValidationMap[m.file_path] = false;
      });
      (data.new_only_files || []).forEach((m) => {
        if (!(m.file_path in newValidationMap)) newValidationMap[m.file_path] = false;
      });
      setMissingValidations(newValidationMap);

      setOldFolder(oldF);
      setNewFolder(newF);

      setStatus({ type: "success", message: `Compared ${data.total_components} components. Found changes in ${data.components_with_changes} components.` });
      // navigate to results
      navigate('/results');
      return data;
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || "Error during folder compare";
      setStatus({ type: "error", message: msg });
      throw e;
    }
  };

  const runCompareAndUpdate = async (missingValidationsList = [], commentsObj = {}) => {
    setStatus({ type: "info", message: "Comparing and updating Excel..." });
    try {
      const res = await apiCompareAndUpdate(oldFolder, newFolder, excelPath, missingValidationsList, commentsObj);
      if (res.excel_update && res.excel_update.success) {
        setStatus({ type: "success", message: `Excel updated: ${res.excel_update.message}` });
      } else if (res.excel_update) {
        setStatus({ type: "error", message: res.excel_update.message });
      } else {
        setStatus({ type: "success", message: 'Compare completed (Excel not requested or failed)' });
      }

      if (res.comparison) setFolderResult(res.comparison);
      return res;
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || 'Error during compare and update';
      setStatus({ type: "error", message: msg });
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

  const setComment = (filePath, key, comment) => {
    setComments((c) => {
      const updated = { ...(c || {}) };
      updated[filePath] = { ...(updated[filePath] || {}), [key]: comment };
      return updated;
    });
  };

  const setEditedContent = (filePath, content) => {
    setEditedFiles((m) => ({ ...(m || {}), [filePath]: content }));
  };

  const value = {
    oldFolder, setOldFolder,
    newFolder, setNewFolder,
    excelPath, setExcelPath,
    folderResult, setFolderResult,
    missingValidations, setMissingValidations,
    comments, setComments, setComment,
    editedFiles, setEditedFiles, setEditedContent,
    selectedFile, setSelectedFile,
    status, setStatus,
    restored, clearSession,
    runFolderCompare, runCompareAndUpdate, fetchFileDiff,
  };

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}

export default ComparisonContext;
