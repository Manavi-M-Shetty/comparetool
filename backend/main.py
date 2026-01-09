"""
FastAPI main application with all endpoints for configuration comparison tool.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
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
from utils.file_utils import path_exists, safe_isdir

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


@app.post("/compare", response_model=dict)
def compare_files_endpoint(request: CompareRequest):
    """
    Compare two individual files and return diff.
    
    Args:
        request: CompareRequest with old_path and new_path
        
    Returns:
        Dictionary with diff results
    """
    if not path_exists(request.old_path):
        raise HTTPException(status_code=404, detail=f"Old file not found: {request.old_path}")
    if not path_exists(request.new_path):
        raise HTTPException(status_code=404, detail=f"New file not found: {request.new_path}")
    
    file_diff = compare_files(request.old_path, request.new_path)
    if file_diff is None:
        raise HTTPException(status_code=500, detail="Error comparing files")
    
    return {
        "file_name": file_diff.file_name,
        "has_changes": file_diff.has_changes,
        "unified_diff": file_diff.unified_diff,
        "diff_lines": [line.dict() for line in file_diff.diff_lines],
        "summary": generate_diff_summary(file_diff)
    }


@app.post("/scan-folders", response_model=ScanFoldersResponse)
def scan_folders_endpoint(request: ScanFoldersRequest):
    """
    Scan two folders and return matched file pairs.
    
    Args:
        request: ScanFoldersRequest with old_folder and new_folder
        
    Returns:
        ScanFoldersResponse with matched pairs and unmatched components
    """
    if not path_exists(request.old_folder) or not safe_isdir(request.old_folder):
        raise HTTPException(status_code=404, detail=f"Old folder not found: {request.old_folder}")
    if not path_exists(request.new_folder) or not safe_isdir(request.new_folder):
        raise HTTPException(status_code=404, detail=f"New folder not found: {request.new_folder}")
    
    matched_pairs, old_only, new_only = match_file_pairs(request.old_folder, request.new_folder)
    
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
def compare_folders_endpoint(request: CompareFoldersRequest):
    """
    Compare two folders recursively and return diff for each matched file.
    
    Args:
        request: CompareFoldersRequest with old_folder and new_folder
        
    Returns:
        CompareFoldersResponse with all file diffs and summary
    """
    if not path_exists(request.old_folder) or not safe_isdir(request.old_folder):
        raise HTTPException(status_code=404, detail=f"Old folder not found: {request.old_folder}")
    if not path_exists(request.new_folder) or not safe_isdir(request.new_folder):
        raise HTTPException(status_code=404, detail=f"New folder not found: {request.new_folder}")
    
    # Get matched file pairs
    matched_pairs, old_only, new_only = match_file_pairs(request.old_folder, request.new_folder)
    
    file_diffs: List[FileDiff] = []
    errors: List[str] = []
    summary: List[str] = []
    
    # Process each matched pair
    for pair in matched_pairs:
        component_name = pair["component_name"]
        config_file_name = pair["config_file_name"]
        old_path = pair["old_path"]
        new_path = pair["new_path"]
        
        # Check if files exist
        if not path_exists(old_path):
            error_msg = f"Config not found for {component_name}, skipping {config_file_name}"
            errors.append(error_msg)
            summary.append(error_msg)
            continue
        
        if not path_exists(new_path):
            error_msg = f"Config not found for {component_name}, skipping {config_file_name}"
            errors.append(error_msg)
            summary.append(error_msg)
            continue
        
        # Compare files
        file_diff = compare_files(old_path, new_path)
        if file_diff is None:
            error_msg = f"Error reading files for {component_name}/{config_file_name}"
            errors.append(error_msg)
            continue
        
        # Set component name
        file_diff.component_name = component_name
        
        # Generate summary
        if file_diff.has_changes:
            change_summary = generate_diff_summary(file_diff)
            summary.append(f"{component_name}/{config_file_name}: {change_summary}")
        else:
            summary.append(f"{component_name}/{config_file_name}: No changes detected")
        
        file_diffs.append(file_diff)
    
    # Add unmatched components to summary
    for comp in old_only:
        summary.append(f"{comp}: Missing in NEW folder")
    for comp in new_only:
        summary.append(f"{comp}: Missing in OLD folder")
    
    # Count components with changes
    components_with_changes = len([fd for fd in file_diffs if fd.has_changes])
    
    # Get unique component names
    unique_components = set([pair["component_name"] for pair in matched_pairs])
    total_components = len(unique_components)
    
    return CompareFoldersResponse(
        total_components=total_components,
        components_with_changes=components_with_changes,
        file_diffs=file_diffs,
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

    return {
        "file_name_old": old_file.filename,
        "file_name_new": new_file.filename,
        "has_changes": has_changes,
        "summary": summary,
        "unified_diff": unified_diff,
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
    
    # Compare folders
    compare_request = CompareFoldersRequest(
        old_folder=old_folder,
        new_folder=new_folder
    )
    compare_result = compare_folders_endpoint(compare_request)
    
    # Update Excel if path provided
    excel_result = None
    if excel_path:
        excel_request = UpdateExcelRequest(
            excel_path=excel_path,
            file_diffs=compare_result.file_diffs
        )
        try:
            excel_result = update_excel_endpoint(excel_request)
        except HTTPException as e:
            excel_result = UpdateExcelResponse(
                success=False,
                message=str(e.detail),
                updated_rows=0
            )
    
    return {
        "comparison": compare_result.dict(),
        "excel_update": excel_result.dict() if excel_result else None,
        "summary": f"Compared {compare_result.total_components} components. "
                  f"Found changes in {compare_result.components_with_changes} components. "
                  f"{excel_result.message if excel_result and excel_result.success else 'Excel update skipped or failed.'}"
    }
