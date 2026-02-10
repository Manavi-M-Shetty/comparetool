"""
FastAPI main application with all REST endpoints for configuration comparison tool.

Provides endpoints for:
- File and folder comparison (diff generation, semantic parsing)
- Excel workbook updates with comparison results
- Workspace management (CRUD operations)
- Browser-based file/folder selection dialogs
- Database delta migration scanning
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from fastapi import Request
import sys
import os
import difflib
import tempfile
from io import BytesIO
from PIL import Image as PILImage, UnidentifiedImageError
import tkinter as tk
from tkinter import filedialog
PILImage.MAX_IMAGE_PIXELS = None
# Add backend directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schemas import (
    CompareRequest, CompareFoldersRequest, CompareFoldersResponse,
    UpdateExcelRequest, UpdateExcelResponse, ScanFoldersRequest, ScanFoldersResponse,
    WriteChangesRequest, WriteChangesResponse,
    CompareAndUpdateRequest,
    WorkspaceCreateRequest, WorkspaceResponse,WorkspaceUpdateRequest,DeltaScanRequest,
    DeltaScanResponse,
    FileDiff
)
from services.folder_compare import match_file_pairs
from services.diff_service import compare_files, generate_diff_summary
from services.excel_service import update_excel_file, write_changes_to_excel,add_diff_image_to_excel,sheet_name_from_component,write_delta_groups_to_excel
from services.workspace_service import create_workspace, list_workspaces, get_workspace, update_workspace, add_comparison_to_history,delete_workspace
from utils.file_utils import path_exists, safe_isdir, safe_read_file, normalize_path

from services.delta_groups import scan_delta_groups

# FastAPI application instance
app = FastAPI(title="Config Compare Tool API", version="1.0.0")

# Enable CORS for frontend development (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health check endpoint - verifies API is running."""
    return {"status": "ok", "message": "Config Compare Tool API"}


from fastapi import Request, Form
import json
import yaml
from typing import Any


@app.post("/compare", response_model=dict)
async def compare_files_endpoint(request: Request, old_path: str = Form(None), new_path: str = Form(None), old_file: UploadFile = File(None), new_file: UploadFile = File(None)):
    """
    Compare two files and return unified and semantic diffs.
    
    Supports three input methods:
    1. File uploads: multipart form data with old_file/new_file
    2. File paths: JSON or form fields with old_path/new_path (for server-side files)
    3. Mixed: Can specify file paths for server files
    
    Returns:
    - Unified diff (standard format)
    - Parsed diff lines with line numbers
    - Semantic diff (structured JSON/XML changes)
    - Raw file contents (for UI side-by-side view)
    - Truncation indicator for large files (>2MB)
    """
    content_type = request.headers.get("content-type", "")

    # Case 1: multipart file upload
    if old_file is not None and new_file is not None:
        try:
            old_bytes = await old_file.read()
            new_bytes = await new_file.read()
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Error reading uploaded files: {exc}")

        old_text_str = old_bytes.decode("utf-8", errors="ignore")
        new_text_str = new_bytes.decode("utf-8", errors="ignore")

        # Compute unified diff
        old_lines = old_text_str.splitlines(keepends=True)
        new_lines = new_text_str.splitlines(keepends=True)
        unified_diff = list(difflib.unified_diff(old_lines, new_lines, fromfile=old_file.filename or "old", tofile=new_file.filename or "new", lineterm=""))

        # Semantic diff from texts
        try:
            from services.semantic_diff import semantic_compare_texts
            semantic = semantic_compare_texts(old_text_str, new_text_str, old_file.filename or "old", new_file.filename or "new")
        except Exception:
            semantic = None

        has_changes = any(
            line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
            for line in unified_diff
        )

        added = sum(1 for line in unified_diff if line.startswith("+") and not line.startswith("+++"))
        removed = sum(1 for line in unified_diff if line.startswith("-") and not line.startswith("---"))

        summary = "No changes detected" if not has_changes else "; ".join([p for p in ([f"{added} line(s) added" if added else None, f"{removed} line(s) removed" if removed else None] ) if p]) or "Changes detected"

        return {
            "file_name_old": old_file.filename,
            "file_name_new": new_file.filename,
            "has_changes": has_changes,
            "summary": summary,
            "unified_diff": unified_diff,
            "semantic_diff": semantic,
            "old_text": old_text_str,
            "new_text": new_text_str
        }

    # Case 2: JSON or form fields with paths
    data = None
    if "application/json" in content_type:
        try:
            data = await request.json()
        except Exception:
            data = None
    if data is None:
        # try form fields provided (old_path/new_path)
        if old_path and new_path:
            data = {"old_path": old_path, "new_path": new_path}

    if not data or not data.get("old_path") or not data.get("new_path"):
        raise HTTPException(status_code=400, detail="Provide either two uploaded files or JSON/form with old_path and new_path")

    old_path_val = data.get("old_path")
    new_path_val = data.get("new_path")

    if not path_exists(old_path_val):
        raise HTTPException(status_code=404, detail=f"Old file not found: {old_path_val}")
    if not path_exists(new_path_val):
        raise HTTPException(status_code=404, detail=f"New file not found: {new_path_val}")

    file_diff = compare_files(old_path_val, new_path_val)
    if file_diff is None:
        raise HTTPException(status_code=500, detail="Error comparing files")

    # Read raw file contents to support side-by-side viewer in frontend
    truncated = False
    try:
        old_text = "".join(safe_read_file(old_path_val) or [])
    except Exception:
        old_text = None

    try:
        new_text = "".join(safe_read_file(new_path_val) or [])
    except Exception:
        new_text = None

    # Always return full unified diff and diff lines
    unified_diff = file_diff.unified_diff
    diff_lines = [line.dict() for line in file_diff.diff_lines]

    return {
        "file_name": file_diff.file_name,
        "has_changes": file_diff.has_changes,
        "unified_diff": unified_diff,
        "diff_lines": diff_lines,
        "semantic_diff": file_diff.semantic_diff,
        "old_text": old_text,
        "new_text": new_text,
        "summary": generate_diff_summary(file_diff),
        "truncated": truncated
    }


@app.post("/scan-folders", response_model=ScanFoldersResponse)
async def scan_folders_endpoint(request: Request):
    """
    Scan two folders and return matched file pairs and missing files.
    Performs initial folder analysis without generating full diffs.
    
    Returns file pairs matched by:
    - Component (folder basename)
    - Filename
    
    Also identifies files that exist in only one folder.
    """
    content_type = request.headers.get("content-type", "")
    old_folder = None
    new_folder = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            old_folder = body.get("old_folder")
            new_folder = body.get("new_folder")
        except Exception:
            pass
    else:
        form = await request.form()
        old_folder = form.get("old_folder")
        new_folder = form.get("new_folder")

    if not old_folder or not new_folder:
        raise HTTPException(status_code=400, detail="old_folder and new_folder are required")

    if not path_exists(old_folder) or not safe_isdir(old_folder):
        raise HTTPException(status_code=404, detail=f"Old folder not found: {old_folder}")
    if not path_exists(new_folder) or not safe_isdir(new_folder):
        raise HTTPException(status_code=404, detail=f"New folder not found: {new_folder}")

    matched_pairs, old_only_files, new_only_files = match_file_pairs(old_folder, new_folder)

    return ScanFoldersResponse(
        matched_pairs=[{
            "component_name": pair["component_name"],
            "config_file_name": pair["config_file_name"],
            "old_path": pair["old_path"],
            "new_path": pair["new_path"]
        } for pair in matched_pairs],
        old_only_files=old_only_files,
        new_only_files=new_only_files
    )


@app.post("/compare-folders", response_model=CompareFoldersResponse)
async def compare_folders_endpoint(request: CompareFoldersRequest):
    """
    Compare two folder hierarchies and return comparison results.
    
    Performs:
    1. Folder tree mirroring (nested structure of old folder)
    2. File matching by component and filename
    3. Lightweight file comparison (metadata only, no full diffs)
    4. Missing file identification
    
    Returns nested folder tree with file summaries to avoid memory overload
    when comparing large folder structures.
    """
    # Validate workspace
    if not get_workspace(request.workspace_id):
        raise HTTPException(status_code=400, detail="Invalid workspace")

    old_root = request.old_folder
    new_root = request.new_folder

    if not old_root or not new_root:
        raise HTTPException(status_code=400, detail="old_folder and new_folder are required")

    if not path_exists(old_root) or not safe_isdir(old_root):
        raise HTTPException(status_code=404, detail=f"Old folder not found: {old_root}")
    if not path_exists(new_root) or not safe_isdir(new_root):
        raise HTTPException(status_code=404, detail=f"New folder not found: {new_root}")

    # Build nested folder tree for OLD folder
    from services.folder_compare import build_folder_tree
    old_tree = build_folder_tree(old_root)

    # Walk the tree and compute lightweight summaries for each file node
    from services.diff_service import compare_files_metadata

    file_summaries = []
    errors = []
    summary = []

    def walk_and_summarize(node, current_rel_path=''):
        # node: {name, path, subfolders, files}
        for f in node.get('files', []):
            old_path = f['path']
            # compute relative path from old_root
            rel = os.path.relpath(old_path, old_root)
            new_path = os.path.join(new_root, rel)
            file_summary = {
                'file_name': f['file_name'],
                'component_name': os.path.dirname(rel) or os.path.basename(old_root),
                'old_path': old_path,
                'new_path': normalize_path(new_path),
                'has_changes': False,
                'summary': 'Missing in NEW',
                'semantic_diff': {'changes': [], 'summary': {}}
            }
            if not path_exists(new_path):
                file_summary['has_changes'] = True
                file_summary['summary'] = 'Missing in NEW'
                file_summaries.append(file_summary)
                continue

            # Compare via metadata (memory-safe)
            md = compare_files_metadata(old_path, new_path)
            if md is None:
                errors.append(f"Error comparing {old_path} <-> {new_path}")
                continue

            file_summary['has_changes'] = md.get('has_changes', False)
            file_summary['summary'] = md.get('summary', '')
            file_summary['semantic_diff'] = {'changes': [], 'summary': md.get('semantic_summary', {})}
            file_summaries.append(file_summary)

        for sub in node.get('subfolders', []):
            walk_and_summarize(sub, os.path.join(current_rel_path, sub.get('name', '')))

    walk_and_summarize(old_tree)

    # new_only_files: files present in new folder but not in old (we'll detect by scanning new tree and comparing relpaths)
    # Build set of old relative paths
    old_rel_paths = set()
    old_only_files = []
    for fs in file_summaries:
        old_rel_paths.add(os.path.relpath(fs['old_path'], old_root))
        # If summary indicates missing in NEW, add to old_only_files
        if fs.get('summary') == 'Missing in NEW':
            old_only_files.append({
                'file_path': fs['old_path'],
                'component_name': fs.get('component_name', ''),
                'missing_side': 'NEW',
                'validated': False
            })

    # Walk new folder tree
    from services.folder_compare import build_folder_tree as build_new_tree
    new_tree = build_new_tree(new_root)

    def collect_new_rel_paths(node):
        rels = []
        for f in node.get('files', []):
            rels.append(os.path.relpath(f['path'], new_root))
        for sub in node.get('subfolders', []):
            rels.extend(collect_new_rel_paths(sub))
        return rels

    new_rel_paths = set(collect_new_rel_paths(new_tree))
    # Files only in new
    only_new_rels = sorted(new_rel_paths - old_rel_paths)

    new_only_files = []
    for rel in only_new_rels:
        new_path = normalize_path(os.path.join(new_root, rel))
        new_only_files.append({
            'file_path': new_path,
            'component_name': os.path.dirname(rel) or os.path.basename(new_root),
            'missing_side': 'OLD',
            'validated': False
        })

    # Get counts
    components_with_changes = len([fs for fs in file_summaries if fs['has_changes']])
    unique_components = set([os.path.dirname(os.path.relpath(fs['old_path'], old_root)) or os.path.basename(old_root) for fs in file_summaries])
    total_components = len(unique_components)

    return CompareFoldersResponse(
        total_components=total_components,
        components_with_changes=components_with_changes,
        folder_tree=old_tree,
        file_summaries=file_summaries,
        old_only_files=old_only_files,
        new_only_files=new_only_files,
        errors=errors,
        summary=summary
    )


@app.post("/compare-files")
async def compare_files_upload(
    old_file: UploadFile = File(...),
    new_file: UploadFile = File(...),
):
    """
    Compare two uploaded files (form-data) and return a unified diff summary.
    This is used by the WinMerge-style single-file comparison UI.
    """
    try:
      old_bytes = await old_file.read()
      new_bytes = await new_file.read()
    except Exception as exc:
      raise HTTPException(status_code=400, detail=f"Error reading uploaded files: {exc}")

    # Decode full contents
    old_text = old_bytes.decode("utf-8", errors="ignore").splitlines(keepends=True)
    new_text = new_bytes.decode("utf-8", errors="ignore").splitlines(keepends=True)

    # Full unified diff
    unified_diff = list(
        difflib.unified_diff(
            old_text,
            new_text,
            fromfile=old_file.filename or "old_file",
            tofile=new_file.filename or "new_file",
            lineterm="",
        )
    )

    # Determine if there are actual content changes
    has_changes = any(
        line.startswith(("+", "-"))
        and not line.startswith(("+++", "---"))
        for line in unified_diff
    )

    # Basic summary (counts of added/removed lines)
    added = sum(
        1
        for line in unified_diff
        if line.startswith("+") and not line.startswith("+++")
    )
    removed = sum(
        1
        for line in unified_diff
        if line.startswith("-") and not line.startswith("---")
    )

    if not has_changes:
        summary = "No changes detected"
    else:
        parts = []
        if added:
            parts.append(f"{added} line(s) added")
        if removed:
            parts.append(f"{removed} line(s) removed")
        summary = "; ".join(parts) if parts else "Changes detected"

    # Semantic diff from texts
    try:
        from services.semantic_diff import semantic_compare_texts
        semantic = semantic_compare_texts(
            "".join(old_text),
            "".join(new_text),
            old_file.filename or "old",
            new_file.filename or "new",
        )
    except Exception:
        semantic = None

    return {
        "file_name_old": old_file.filename,
        "file_name_new": new_file.filename,
        "has_changes": has_changes,
        "summary": summary,
        "unified_diff": unified_diff,
        "semantic_diff": semantic,
        "old_text": "".join(old_text),
        "new_text": "".join(new_text),
        "truncated": False,
    }

@app.post("/compare-and-update")
def compare_and_update_endpoint(request: CompareAndUpdateRequest):
    """
    Combined endpoint: Compare folders and optionally update Excel in one operation.
    Primary endpoint used by the UI for the standard comparison workflow.
    
    Workflow:
    1. Scans both folders and matches files
    2. Optionally validates missing files based on user confirmations
    3. Generates full diffs for changed files
    4. Updates Excel with results if path provided and validations satisfied
    5. Returns comparison results and Excel operation status
    
    Args:
        request: CompareAndUpdateRequest with folders, Excel path, validations, comments
        
    Returns:
        Combined dict with comparison results and Excel update status
    """
    # Validate workspace
    if not get_workspace(request.workspace_id):
        raise HTTPException(status_code=400, detail="Invalid workspace")


@app.post("/save-edited-file")
async def save_edited_file_endpoint(payload: dict):
    """
    Save user-edited file content back to the file system.
    Performs light syntax validation for JSON and YAML files before writing.
    
    Workflow:
    1. Validates syntax based on file extension (JSON/YAML)
    2. Creates directories if necessary
    3. Writes updated content to disk
    
    Args:
        payload: Dict with file_path and updated_content
        
    Returns:
        Success status with file path and modified flag
    """
    file_path = payload.get('file_path')
    updated_content = payload.get('updated_content')

    if not file_path or updated_content is None:
        raise HTTPException(status_code=400, detail="file_path and updated_content are required")

    # Basic syntax validation based on extension
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()

    try:
        if ext == '.json':
            json.loads(updated_content)
        elif ext in ('.yml', '.yaml'):
            yaml.safe_load(updated_content)
        # other extensions: no strict validation performed
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Syntax error detected for {ext} file: {exc}")

    # Ensure directory exists
    dirpath = os.path.dirname(file_path)
    if dirpath and not os.path.exists(dirpath):
        try:
            os.makedirs(dirpath, exist_ok=True)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Unable to create directory for file: {exc}")

    # Write the file
    try:
        with open(file_path, 'w', encoding='utf-8', newline='') as fo:
            fo.write(updated_content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to write file: {exc}")

    return {"success": True, "message": "File saved", "file_path": file_path, "modified": True}
    """
    Combined endpoint: Compare folders and update Excel in one operation.
    This is the main endpoint used by the UI.
    
    Args:
        request: Dictionary with old_folder, new_folder, and excel_path
        
    Returns:
        Combined result with comparison and Excel update status
    """
    old_folder = request.old_folder
    new_folder = request.new_folder
    excel_path = request.excel_path
    
    if not old_folder or not new_folder:
        raise HTTPException(status_code=400, detail="old_folder and new_folder are required")
    
    # Reuse metadata logic to generate a compare_result-like structure
    from services.folder_compare import build_folder_tree
    from services.diff_service import compare_files_metadata, compare_files

    old_tree = build_folder_tree(old_folder)

    # Flatten file summaries
    file_summaries = []
    from services.folder_compare import is_config_file

    for dirpath, dirnames, filenames in os.walk(old_folder):
        for fname in filenames:
            # skip non-config files
            if not is_config_file(fname):
                continue
            old_path = normalize_path(os.path.join(dirpath, fname))
            rel = os.path.relpath(old_path, old_folder)
            new_path = normalize_path(os.path.join(new_folder, rel))
            if not path_exists(new_path):
                file_summaries.append({
                    'file_name': fname,
                    'component_name': os.path.dirname(rel) or os.path.basename(old_folder),
                    'old_path': old_path,
                    'new_path': new_path,
                    'has_changes': True,
                    'summary': 'Missing in NEW',
                    'semantic_diff': {'changes': [], 'summary': {}}
                })
                continue
            md = compare_files_metadata(old_path, new_path)
            if md is None:
                continue
            file_summaries.append({
                'file_name': fname,
                'component_name': os.path.dirname(rel) or os.path.basename(old_folder),
                'old_path': old_path,
                'new_path': new_path,
                'has_changes': md.get('has_changes', False),
                'summary': md.get('summary', ''),
                'semantic_diff': { 'changes': [], 'summary': md.get('semantic_summary', {}) }
            })

    # Compute old_only_files (files present only in old) and new_only_files (present only in new)
    old_rel_paths = set([os.path.relpath(fs['old_path'], old_folder) for fs in file_summaries])
    new_rel_paths = set()
    for dirpath, dirnames, filenames in os.walk(new_folder):
        for fname in filenames:
            if not build_folder_tree.__module__:  # trivial noop to avoid linter complaint
                pass
            rel = os.path.relpath(os.path.join(dirpath, fname), new_folder)
            new_rel_paths.add(rel)

    only_new_rels = sorted(new_rel_paths - old_rel_paths)
    new_only_files = [
        {
            'file_path': normalize_path(os.path.join(new_folder, rel)),
            'component_name': os.path.dirname(rel) or os.path.basename(new_folder),
            'missing_side': 'OLD',
            'validated': False
        }
        for rel in only_new_rels
    ]

    old_only_files = [
        {
            'file_path': fs['old_path'],
            'component_name': fs.get('component_name', ''),
            'missing_side': 'NEW',
            'validated': False
        }
        for fs in file_summaries if fs.get('summary') == 'Missing in NEW'
    ]

    compare_result = {
        'total_components': len(set([fs['component_name'] for fs in file_summaries])),
        'components_with_changes': len([fs for fs in file_summaries if fs['has_changes']]),
        'file_summaries': file_summaries,
        'folder_tree': old_tree,
        'old_only_files': old_only_files,
        'new_only_files': new_only_files,
        'errors': [],
        'summary': []
    }

    # If excel_path provided and there are missing files that are not validated, block Excel update early
    missing_validations = request.get('missing_validations', [])
    validated_paths = set([m.get('file_path') for m in missing_validations if m.get('validated')])

    unvalidated_missing = [mf for mf in (old_only_files + new_only_files) if mf.get('file_path') not in validated_paths]

    if excel_path and unvalidated_missing:
        return {
            "comparison": compare_result,
            "excel_update": {
                "success": False,
                "message": "Cannot generate Excel: some missing files are not validated.",
                "updated_rows": 0
            },
            "summary": f"Compared {compare_result['total_components']} components. Found changes in {compare_result['components_with_changes']} components. Excel generation blocked due to unvalidated missing files."
        }

    # Update Excel if path provided: compute full diffs only for changed files to limit memory
    excel_result = None
    if excel_path:
        errors_local = []
        full_file_diffs = []
        for fd_summary in compare_result['file_summaries']:
            if fd_summary.get('has_changes'):
                try:
                    fd = compare_files(fd_summary['old_path'], fd_summary['new_path'])
                    if fd:
                        fd.component_name = fd_summary.get('component_name', '')
                        full_file_diffs.append(fd)
                except Exception as e:
                    errors_local.append(f"Error generating full diff for {fd_summary.get('file_name')}: {e}")
        try:
            excel_request = UpdateExcelRequest(
                excel_path=excel_path,
                file_diffs=full_file_diffs,
                comments=request.get('comments', {})
            )
            excel_result = update_excel_endpoint(excel_request)
        except HTTPException as e:
            excel_result = UpdateExcelResponse(
                success=False,
                message=str(e.detail),
                updated_rows=0
            )

    return {
        "comparison": compare_result,
        "excel_update": excel_result.dict() if excel_result else None,
        "summary": f"Compared {compare_result['total_components']} components. "
                  f"Found changes in {compare_result['components_with_changes']} components. "
                  f"{excel_result.message if excel_result and excel_result.success else 'Excel update skipped or failed.'}"
    }


@app.post("/write-changes", response_model=WriteChangesResponse)
async def write_changes_endpoint(request: WriteChangesRequest):
    """Write reviewed changes to Excel file.
    
    Args:
        request: WriteChangesRequest with excel_path and changes
        
    Returns:
        WriteChangesResponse with success status
    """
    success, message, written_rows = write_changes_to_excel(request.excel_path, request.changes)
    return WriteChangesResponse(success=success, message=message, written_rows=written_rows)


@app.post("/workspace/create", response_model=WorkspaceResponse)
async def create_workspace_endpoint(request: WorkspaceCreateRequest):
    """
    Create a new workspace for managing comparison projects.
    
    Supports two configuration models:
    - Legacy: single old/new folder pair with Excel path
    - Hierarchical: multiple environments, each with multiple servers
    
    Args:
        request: WorkspaceCreateRequest with name, project details, and optional configuration
        
    Returns:
        WorkspaceResponse with created workspace metadata
    """
    workspace = create_workspace(
        name=request.name,
        old_folder=request.old_folder or "",
        new_folder=request.new_folder or "",
        excel_path=request.excel_path or "",
        project_name=request.project_name or request.name,
        # Store nested models as plain dicts in metadata.json
        environments=[env.dict() for env in request.environments],
    )
    return WorkspaceResponse(**workspace)

@app.get("/workspace/list")
async def list_workspaces_endpoint():
    """List all available workspaces."""
    return {"workspaces": list_workspaces()}


@app.get("/workspace/{name}", response_model=WorkspaceResponse)
async def get_workspace_endpoint(name: str):
    """Retrieve complete metadata for a specific workspace."""
    workspace = get_workspace(name)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceResponse(**workspace)


@app.put("/workspace/{name}", response_model=WorkspaceResponse)
async def update_workspace_endpoint(name: str, request: WorkspaceUpdateRequest):
    """
    Update workspace configuration (environments, servers, display name, etc.).
    Performs partial update - only specified fields are changed.
    """
    existing = get_workspace(name)
    if not existing:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # This already returns nested dicts; no extra .dict() calls needed
    updates = request.dict(exclude_unset=True)

    ok = update_workspace(name, updates)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update workspace")

    refreshed = get_workspace(name)
    return WorkspaceResponse(**refreshed)


@app.delete("/workspace/{name}")
async def delete_workspace_endpoint(name: str):
    """Delete a workspace and all associated metadata/history."""
    success = delete_workspace(name)
    if not success:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {"success": True}



@app.post("/write-diff-image")
async def write_diff_image_endpoint(
    excel_path: str = Form(...),
    file_name: str = Form(...),
    component_name: str = Form("", alias="componentName"),
    server_name: str = Form("", alias="serverName"),
    image: UploadFile = File(...)
):
    """
    Receive a diff screenshot and add it to Excel workbook.
    Creates a sheet per component and embeds images with metadata.
    
    Accepts componentName in camelCase (matching frontend conventions).
    Validates image format before embedding.
    """
    import uuid

    TEMP_IMG_DIR = os.path.join(os.getcwd(), "temp_images")
    os.makedirs(TEMP_IMG_DIR, exist_ok=True)

    # Temp file path
    ext = os.path.splitext(image.filename or "diff.png")[1] or ".png"
    img_path = os.path.join(TEMP_IMG_DIR, f"{uuid.uuid4()}{ext}")

    # Read all uploaded data
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Invalid image upload: empty file")

    # Validate in memory
    try:
        with PILImage.open(BytesIO(image_bytes)) as im:
            im.verify()
    except UnidentifiedImageError as exc:
        # Not a valid image
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image upload: cannot identify image file ({exc})",
        )
    except Exception as exc:
        # Any other Pillow error
        raise HTTPException(status_code=400, detail=f"Invalid image upload: {exc}")

    # If valid, write to disk
    with open(img_path, "wb") as f:
        f.write(image_bytes)

    try:
        success, message, _ = add_diff_image_to_excel(
            excel_path=excel_path,
            file_name=file_name,
            component_name=component_name,
            image_file_path=img_path,
            sheet_name=sheet_name_from_component(component_name),
            server_name=server_name,
        )
    finally:
        # Cleanup temp file
        try:
            os.remove(img_path)
        except Exception:
            pass

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message}


@app.get("/browse")
def browse_folder_dialog():
    """
    Open a native system folder selection dialog.
    Returns the selected folder path.
    """
    try:
        # Create a hidden Tkinter root window
        root = tk.Tk()
        root.withdraw()  # Hide the main window
        root.attributes('-topmost', True)  # Make dialog appear on top
        
        # Open the dialog
        path = filedialog.askdirectory(title="Select Folder")
        
        root.destroy()  # Clean up
        
        if path:
            # User selected a folder
            return {"success": True, "path": path.replace("/", "\\")}
        else:
            # User cancelled
            return {"success": False, "message": "User cancelled folder selection"}
    except Exception as e:
        print(f"Error opening dialog: {e}")
        return {"success": False, "message": "Error opening folder selection dialog"}


@app.get("/browse-file")
def browse_file_dialog():
    """
    Open a native system file selection dialog (Excel files).
    Returns the selected file path.
    """
    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        
        # Open file dialog filtering for Excel
        path = filedialog.askopenfilename(
            title="Select Excel File",
            filetypes=[("Excel files", "*.xlsx;*.xls")]
        )
        
        root.destroy()
        
        return {"path": path.replace("/", "\\") if path else ""} 
    except Exception as e:
        print(f"Error opening file dialog: {e}")
        return {"path": ""}
    

@app.post("/delta-scan", response_model=DeltaScanResponse)
def delta_scan_endpoint(request: DeltaScanRequest):
    """
    Scan a database folder structure for delta migration scripts.
    
    Expected structure:
        DatabaseName/
            BaseDrop/      
            DeltaDrop/     
                TableScripts/
                StoredProcedures/
                ...
    
    Extracts delta groups and optionally writes matrix layout to Excel.
    
    Args:
        request: DeltaScanRequest with database root and optional Excel path
        
    Returns:
        DeltaScanResponse with delta groups and Excel operation status
    """
    root = request.root_folder
    excel_path = request.excel_path or ""

    if not path_exists(root) or not safe_isdir(root):
        raise HTTPException(status_code=404, detail=f"Root folder not found: {root}")

    data = scan_delta_groups(root)
    db_name = data.get("database_name") or ""
    groups = data.get("groups") or []

    if not db_name or not groups:
        return DeltaScanResponse(
            database_name=db_name,
            groups=groups,
            excel_written=False,
            message="No delta groups or SQL files found under DeltaDrop.",
        )

    excel_written = False
    msg = "Scan completed (Excel not written)."

    if excel_path:
        success, message, _ = write_delta_groups_to_excel(
            excel_path, db_name, groups, sheet_name=db_name
        )
        excel_written = success
        msg = message

        if not success:
            return DeltaScanResponse(
                database_name=db_name,
                groups=groups,
                excel_written=False,
                message=message,
            )

    return DeltaScanResponse(
        database_name=db_name,
        groups=groups,
        excel_written=excel_written,
        message=msg,
    )