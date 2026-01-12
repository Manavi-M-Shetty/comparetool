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
    semantic_diff: Optional[Dict[str, Any]] = None  # Structured semantic diff (if available)


class FileDiffSummary(BaseModel):
    """Lightweight file diff summary used for folder comparison responses."""
    file_name: str
    component_name: str
    has_changes: bool
    summary: str
    old_path: str
    new_path: str
    semantic_diff: Optional[Dict[str, Any]] = None


class CompareFoldersRequest(BaseModel):
    """Request model for comparing folders."""
    old_folder: str
    new_folder: str


from pydantic import Field


class FolderNode(BaseModel):
    """Nested folder node for responses."""
    name: str
    path: str
    subfolders: List["FolderNode"] = Field(default_factory=list)
    files: List[Dict[str, Any]] = Field(default_factory=list)


class CompareFoldersResponse(BaseModel):
    """Response model for folder comparison."""
    total_components: int
    components_with_changes: int
    folder_tree: FolderNode
    file_summaries: List[FileDiffSummary]
    old_only: List[str]
    new_only: List[str]
    errors: List[str]
    summary: List[str]


FolderNode.update_forward_refs()


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
