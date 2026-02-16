import axios from "axios";

/**
 * API client module for backend communication.
 * Uses axios with relative base URL for Vite proxy forwarding.
 * All requests go through /api/* which Vite proxies to the backend.
 */

// Use relative base so Vite proxy can route `/api/*` -> backend (avoids CORS and mixed-port confusion)
const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Compare two uploaded files using multipart form data.
 * Handles file uploads directly without file system paths.
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
 * Scan two folders for config files and perform initial matching.
 * Returns matched pairs and files that exist in only one folder.
 */
export const scanFolders = async (oldFolder, newFolder) => {
  const res = await api.post("/scan-folders", {
    old_folder: oldFolder,
    new_folder: newFolder,
  });
  return res.data;
};

/**
 * Compare two folders recursively.
 * Returns nested folder tree and lightweight summaries for all files.
 */
export const compareFolders = async (oldFolder, newFolder, workspaceId) => {
  const res = await api.post("/compare-folders", {
    old_folder: oldFolder,
    new_folder: newFolder,
    workspace_id: workspaceId,
  });
  return res.data;
};


/**
 * Compare folders and optionally update Excel in a single operation.
 * Used by UI for combined compare + Excel update workflow.
 */
export const compareAndUpdate = async (oldFolder, newFolder, excelPath, missingValidations = [], comments = {}, workspaceId) => {
  const res = await api.post("/compare-and-update", {
    old_folder: oldFolder,
    new_folder: newFolder,
    excel_path: excelPath || null,
    missing_validations: missingValidations,
    comments: comments,
    workspace_id: workspaceId
  });
  return res.data;
};

/**
 * Save user-edited file content back to disk.
 * Performs light syntax validation for JSON/YAML files.
 */
export const saveEditedFile = async (payload) => {
  const res = await api.post("/save-edited-file", payload);
  return res.data;
};

/**
 * Update Excel file with comparison diff results.
 * Adds diff data to new sheets or existing workbook.
 */
export const updateExcel = async (excelPath, fileDiffs) => {
  const res = await api.post("/update-excel", {
    excel_path: excelPath,
    file_diffs: fileDiffs,
  });
  return res.data;
};

/**
 * Compare two files by path on the backend.
 * Returns unified diff, semantic diff, and file contents.
 */
export const compareFilePaths = async (oldPath, newPath) => {
  const res = await api.post("/compare", {
    old_path: oldPath,
    new_path: newPath,
  });
  return res.data;
};

/**
 * Write reviewed/approved changes to Excel workbook.
 * Persists user decisions and comments.
 */
export const writeChanges = async (excelPath, changes) => {
  const res = await api.post("/write-changes", {
    excel_path: excelPath,
    changes: changes,
  });
  return res.data;
};

// ===== Workspace Management API Calls =====

/**
 * Create a new workspace with configuration.
 * Supports both legacy single-folder and new hierarchical environment/server model.
 */
export const createWorkspace = async (
  name,
  oldFolder = "",
  newFolder = "",
  excelPath = "",
  projectName = "",
  environments = []
) => {
  const res = await api.post("/workspace/create", {
    name,
    project_name: projectName || name,
    old_folder: oldFolder,
    new_folder: newFolder,
    excel_path: excelPath,
    environments,
  });
  return res.data;
};

/**
 * List all available workspaces.
 */
export const listWorkspaces = async () => {
  const res = await api.get("/workspace/list");
  return res.data.workspaces;
};

/**
 * Retrieve complete metadata for a workspace.
 */
export const getWorkspace = async (name) => {
  const res = await api.get(`/workspace/${name}`);
  return res.data;
};

/**
 * Delete a workspace and all associated metadata.
 */
export const deleteWorkspace = async (name) => {
  const res = await api.delete(`/workspace/${name}`);
  return res.data;
};

/**
 * Update workspace configuration (partial update).
 * Can update environments, servers, or display name.
 */
export const updateWorkspace = async (name, updates) => {
  const res = await api.put(`/workspace/${name}`, updates);
  return res.data;
};


/**
 * Upload a diff screenshot to Excel workbook.
 * Embeds the image as a new page with metadata (filename, component, server).
 *
 * @param {string} excelPath - Path to Excel workbook
 * @param {string} fileName - Name of the file being diffed
 * @param {Blob} imageBlob - Screenshot image blob
 * @param {string} componentName - Component/folder name for metadata
 * @param {string} serverName - Server identifier for metadata
 * @returns {Promise} Response from upload endpoint
 */
export const uploadDiffScreenshot = async (
  excelPath,
  fileName,
  imageBlob,
  componentName = '',
  serverName = ''
) => {
  const formData = new FormData();
  formData.append('excel_path', excelPath);
  formData.append('file_name', fileName);
  formData.append('componentName', componentName);
  formData.append('serverName', serverName);
  formData.append('image', imageBlob, `${fileName || 'diff'}.png`);

  const res = await axios.post(`${API_BASE_URL}/write-diff-image`, formData);
  return res.data;
};

/**
 * Compare two folders by uploading files.
 * Sends folder contents as multipart form data.
 * Files maintain their relative paths through webkitdirectory attribute.
 */
export const compareFoldersUpload = async (oldFiles, newFiles, workspaceId) => {
  const formData = new FormData();
  
  // Add all files from old folder
  for (const file of oldFiles) {
    formData.append('old_files', file, file.webkitRelativePath);
  }
  
  // Add all files from new folder
  for (const file of newFiles) {
    formData.append('new_files', file, file.webkitRelativePath);
  }
  
  // Add workspace ID
  formData.append('workspace_id', workspaceId);
  
  const res = await axios.post(`${API_BASE_URL}/compare-folders`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res.data;
};


/**
 * Open system folder picker dialog.
 * Uses backend tkinter integration to display native file browser.
 *
 * @returns {Promise<string>} Selected folder path, or empty string if cancelled
 */
export async function browseSystemFolder() {
  try {
    const res = await fetch(`${API_BASE_URL}/browse`);
    if (!res.ok) throw new Error('Failed to open dialog');
    const data = await res.json();
    return data.path || '';
  } catch (err) {
    console.error(err);
    return '';
  }
}

/**
 * Open system file picker dialog.
 * Uses backend tkinter integration to display native file browser.
 *
 * @returns {Promise<string>} Selected file path, or empty string if cancelled
 */
export async function browseSystemFile() {
  try {
    const res = await fetch(`${API_BASE_URL}/browse-file`);
    if (!res.ok) throw new Error('Failed to open file dialog');
    const data = await res.json();
    return data.path || '';
  } catch (err) {
    console.error(err);
    return '';
  }
}

/**
 * Scan database delta migration folder structure.
 * Extracts delta groups (migration script collections) from DeltaDrop folder structure.
 *
 * @param {string} rootFolder - Path to database root folder (contains BaseDrop and DeltaDrop)
 * @param {string} excelPath - Optional: Path to Excel file for writing results
 * @returns {Promise<Object>} Response with database_name, groups[], excel_written, and message
 */
export const scanDeltaGroups = async (rootFolder, excelPath = '') => {
  const res = await api.post('/delta-scan', {
    root_folder: rootFolder,
    excel_path: excelPath || '',
  });
  return res.data;
};
