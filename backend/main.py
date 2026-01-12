"""
FastAPI main application with all endpoints for configuration comparison tool.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from fastapi import Request
import sys
import os
import difflib

# Add backend directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schemas import (
    CompareRequest, CompareFoldersRequest, CompareFoldersResponse,
    UpdateExcelRequest, UpdateExcelResponse, ScanFoldersRequest, ScanFoldersResponse,
    FileDiff
)
from services.folder_compare import match_file_pairs
from services.diff_service import compare_files, generate_diff_summary
from services.excel_service import update_excel_file
from utils.file_utils import path_exists, safe_isdir, safe_read_file, normalize_path

app = FastAPI(title="Config Compare Tool API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Config Compare Tool API"}


from fastapi import Request, Form


@app.post("/compare", response_model=dict)
async def compare_files_endpoint(request: Request, old_path: str = Form(None), new_path: str = Form(None), old_file: UploadFile = File(None), new_file: UploadFile = File(None)):
    """
    Compare two individual files and return diff.
    Supports:
      - JSON body with `old_path` and `new_path`
      - form-data with `old_path`/`new_path` fields
      - multipart file upload with `old_file` and `new_file`
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
    MAX_BYTES = 2 * 1024 * 1024  # 2MB limit per file to avoid memory blowups
    truncated = False
    old_text = None
    new_text = None
    try:
        if os.path.getsize(old_path_val) <= MAX_BYTES:
            old_text = "".join(safe_read_file(old_path_val) or [])
        else:
            # return a truncated preview
            truncated = True
            import itertools
            with open(old_path_val, 'r', encoding='utf-8', errors='ignore') as fo:
                old_text = ''.join(list(itertools.islice(fo, 200)))
                old_text += '\n...[truncated]'
    except Exception:
        old_text = None
    try:
        if os.path.getsize(new_path_val) <= MAX_BYTES:
            new_text = "".join(safe_read_file(new_path_val) or [])
        else:
            truncated = True
            import itertools
            with open(new_path_val, 'r', encoding='utf-8', errors='ignore') as fn:
                new_text = ''.join(list(itertools.islice(fn, 200)))
                new_text += '\n...[truncated]'
    except Exception:
        new_text = None

    # If files too big, avoid returning full unified diff to save memory
    unified_diff = file_diff.unified_diff if not truncated else []
    diff_lines = [line.dict() for line in file_diff.diff_lines] if not truncated else []

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
    Scan two folders and return matched file pairs.

    Accepts JSON body or form-data (old_folder/new_folder).
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

    matched_pairs, old_only, new_only = match_file_pairs(old_folder, new_folder)

    return ScanFoldersResponse(
        matched_pairs=[{
            "component_name": pair["component_name"],
            "config_file_name": pair["config_file_name"],
            "old_path": pair["old_path"],
            "new_path": pair["new_path"]
        } for pair in matched_pairs],
        old_only=old_only,
        new_only=new_only
    )


@app.post("/compare-folders", response_model=CompareFoldersResponse)



async def compare_folders_endpoint(request: Request):
    """
    Compare two folders recursively and return a nested folder tree (mirroring OLD folder) with lightweight file summaries.
    Supports JSON body or form-data (old_folder/new_folder).
    """
    content_type = request.headers.get("content-type", "")
    old_root = None
    new_root = None

    if "application/json" in content_type:
        try:
            body =  await request.json()
            old_root = body.get("old_folder")
            new_root = body.get("new_folder")
        except Exception:
            pass
    else:
        # try form fields
        form = await request.form()
        old_root = form.get("old_folder")
        new_root = form.get("new_folder")

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
    old_only = []
    new_only = []

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

    # new_only: files present in new folder but not in old (we'll detect by scanning new tree and comparing relpaths)
    # Build set of old relative paths
    old_rel_paths = set()
    for fs in file_summaries:
        old_rel_paths.add(os.path.relpath(fs['old_path'], old_root))

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
    only_new = list(sorted(new_rel_paths - old_rel_paths))

    # Get counts
    components_with_changes = len([fs for fs in file_summaries if fs['has_changes']])
    unique_components = set([os.path.dirname(os.path.relpath(fs['old_path'], old_root)) or os.path.basename(old_root) for fs in file_summaries])
    total_components = len(unique_components)

    return CompareFoldersResponse(
        total_components=total_components,
        components_with_changes=components_with_changes,
        folder_tree=old_tree,
        file_summaries=file_summaries,
        old_only=[],
        new_only=only_new,
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

    MAX_BYTES = 2 * 1024 * 1024  # 2MB
    truncated = False
    if len(old_bytes) > MAX_BYTES or len(new_bytes) > MAX_BYTES:
        # avoid building large diffs for very large uploads
        truncated = True
        # read first ~200 lines as preview
        old_preview = old_bytes.decode('utf-8', errors='ignore').splitlines()[:200]
        new_preview = new_bytes.decode('utf-8', errors='ignore').splitlines()[:200]
        unified_diff = []
        has_changes = True
        summary = "Preview truncated due to large file"
        semantic = None
    else:
        old_text = old_bytes.decode("utf-8", errors="ignore").splitlines(keepends=True)
        new_text = new_bytes.decode("utf-8", errors="ignore").splitlines(keepends=True)

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
            semantic = semantic_compare_texts("".join(old_text), "".join(new_text), old_file.filename or "old", new_file.filename or "new")
        except Exception:
            semantic = None

    return {
        "file_name_old": old_file.filename,
        "file_name_new": new_file.filename,
        "has_changes": has_changes,
        "summary": summary,
        "unified_diff": unified_diff,
        "semantic_diff": semantic,
        "old_text": ("\n".join(old_preview) + "\n...[truncated]") if truncated else "".join(old_text),
        "new_text": ("\n".join(new_preview) + "\n...[truncated]") if truncated else "".join(new_text),
        "truncated": truncated
    }


@app.post("/update-excel", response_model=UpdateExcelResponse)
def update_excel_endpoint(request: UpdateExcelRequest):
    """
    Update Excel file with comparison results.
    
    Args:
        request: UpdateExcelRequest with excel_path and file_diffs
        
    Returns:
        UpdateExcelResponse with success status and message
    """
    success, message, updated_rows = update_excel_file(
        request.excel_path,
        request.file_diffs
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return UpdateExcelResponse(
        success=True,
        message=message,
        updated_rows=updated_rows
    )


@app.post("/compare-and-update")
def compare_and_update_endpoint(request: dict):
    """
    Combined endpoint: Compare folders and update Excel in one operation.
    This is the main endpoint used by the UI.
    
    Args:
        request: Dictionary with old_folder, new_folder, and excel_path
        
    Returns:
        Combined result with comparison and Excel update status
    """
    old_folder = request.get("old_folder")
    new_folder = request.get("new_folder")
    excel_path = request.get("excel_path")
    
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

    compare_result = {
        'total_components': len(set([fs['component_name'] for fs in file_summaries])),
        'components_with_changes': len([fs for fs in file_summaries if fs['has_changes']]),
        'file_summaries': file_summaries,
        'folder_tree': old_tree,
        'old_only': [],
        'new_only': [],
        'errors': [],
        'summary': []
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
                file_diffs=full_file_diffs
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
