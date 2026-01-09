"""
Pydantic schemas for API request/response models.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class CompareRequest(BaseModel):
    """Request model for comparing two files."""
    old_path: str
    new_path: str


class FilePair(BaseModel):
    """Model for a matched file pair."""
    component_name: str
    config_file_name: str
    old_path: str
    new_path: str


class DiffLine(BaseModel):
    """Model for a single diff line."""
    line_type: str  # 'added', 'removed', 'context', 'header'
    content: str
    old_line_num: Optional[int] = None
    new_line_num: Optional[int] = None


class FileDiff(BaseModel):
    """Model for file diff result."""
    file_name: str
    component_name: str
    has_changes: bool
    diff_lines: List[DiffLine]
    unified_diff: List[str]  # Raw unified diff output


class CompareFoldersRequest(BaseModel):
    """Request model for comparing folders."""
    old_folder: str
    new_folder: str


class CompareFoldersResponse(BaseModel):
    """Response model for folder comparison."""
    total_components: int
    components_with_changes: int
    file_diffs: List[FileDiff]
    errors: List[str]
    summary: List[str]


class UpdateExcelRequest(BaseModel):
    """Request model for updating Excel file."""
    excel_path: str
    file_diffs: List[FileDiff]


class UpdateExcelResponse(BaseModel):
    """Response model for Excel update."""
    success: bool
    message: str
    updated_rows: int


class ScanFoldersRequest(BaseModel):
    """Request model for scanning folders."""
    old_folder: str
    new_folder: str


class ScanFoldersResponse(BaseModel):
    """Response model for folder scan."""
    matched_pairs: List[FilePair]
    old_only: List[str]
    new_only: List[str]
