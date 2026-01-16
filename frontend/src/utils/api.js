import axios from "axios";

// Use relative base so Vite proxy can route `/api/*` -> backend (avoids CORS and mixed-port confusion)
const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Compare two uploaded files using form-data.
 */
export const compareFilesUpload = async (oldFile, newFile) => {
  const formData = new FormData();
  formData.append("old_file", oldFile);
  formData.append("new_file", newFile);

  const res = await axios.post(`/api/compare-files`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

/**
 * Scan two folders and return matched file pairs
 */
export const scanFolders = async (oldFolder, newFolder) => {
  const res = await api.post("/scan-folders", {
    old_folder: oldFolder,
    new_folder: newFolder,
  });
  return res.data;
};

/**
 * Compare two folders via proxy '/api/*' to backend
 */
export const compareFolders = async (oldFolder, newFolder) => {
  const res = await api.post("/compare-folders", {
    old_folder: oldFolder,
    new_folder: newFolder,
  });
  return res.data;
};

/**
 * Compare folders and update excel via proxy
 */
export const compareAndUpdate = async (oldFolder, newFolder, excelPath, missingValidations = [], comments = {}) => {
  const res = await api.post("/compare-and-update", {
    old_folder: oldFolder,
    new_folder: newFolder,
    excel_path: excelPath || null,
    missing_validations: missingValidations,
    comments: comments
  });
  return res.data;
};

export const saveEditedFile = async (payload) => {
  const res = await api.post("/save-edited-file", payload);
  return res.data;
};



/**
 * Update Excel file with comparison results
 */
export const updateExcel = async (excelPath, fileDiffs) => {
  const res = await api.post("/update-excel", {
    excel_path: excelPath,
    file_diffs: fileDiffs,
  });
  return res.data;
};


/**
 * Compare two files by path on the backend (returns unified diff, semantic diff, and raw texts)
 */
export const compareFilePaths = async (oldPath, newPath) => {
  const res = await api.post("/compare", {
    old_path: oldPath,
    new_path: newPath,
  });
  return res.data;
};
