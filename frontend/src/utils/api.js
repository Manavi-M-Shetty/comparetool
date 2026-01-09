import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

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

  const res = await axios.post(`${API_BASE_URL}/compare-files`, formData, {
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
 * Compare two folders recursively
 */
export const compareFolders = async (oldFolder, newFolder) => {
  const res = await api.post("/compare-folders", {
    old_folder: oldFolder,
    new_folder: newFolder,
  });
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
 * Combined endpoint: Compare folders and update Excel
 */
export const compareAndUpdate = async (oldFolder, newFolder, excelPath) => {
  const res = await api.post("/compare-and-update", {
    old_folder: oldFolder,
    new_folder: newFolder,
    excel_path: excelPath || null,
  });
  return res.data;
};
