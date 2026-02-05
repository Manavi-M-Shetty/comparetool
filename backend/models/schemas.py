"""
Pydantic schemas for API request/response models.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


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
    workspace_id: str


from pydantic import Field


class FolderNode(BaseModel):
    """Nested folder node for responses."""
    name: str
    path: str
    subfolders: List["FolderNode"] = Field(default_factory=list)
    files: List[Dict[str, Any]] = Field(default_factory=list)


class MissingFileEntry(BaseModel):
    """Model for files that exist only on one side of the comparison."""
    file_path: str
    component_name: str
    missing_side: str  # 'OLD' or 'NEW' - indicates which side is missing this file
    validated: bool = False


class CompareFoldersResponse(BaseModel):
    """Response model for folder comparison."""
    total_components: int
    components_with_changes: int
    folder_tree: FolderNode
    file_summaries: List[FileDiffSummary]
    old_only_files: List[MissingFileEntry]
    new_only_files: List[MissingFileEntry]
    errors: List[str]
    summary: List[str]


FolderNode.update_forward_refs()


class UpdateExcelRequest(BaseModel):
    """Request model for updating Excel file."""
    excel_path: str
    file_diffs: List[FileDiff]
    comments: Optional[Dict[str, Dict[str, str]]] = None  # { file_path: { key: comment } }


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
    old_only_files: List[MissingFileEntry]
    new_only_files: List[MissingFileEntry]


class WriteChangesRequest(BaseModel):
    """Request model for writing reviewed changes to Excel."""
    excel_path: str
    changes: List[Dict[str, str]]  # Each dict: componentName, fileName, changedLine, comment


class WriteChangesResponse(BaseModel):
    """Response model for writing changes."""
    success: bool
    message: str
    written_rows: int


class CompareAndUpdateRequest(BaseModel):
    """Request model for compare and update."""
    old_folder: str
    new_folder: str
    excel_path: str
    missing_validations: Optional[List[str]] = []
    comments: Optional[Dict[str, Dict[str, str]]] = {}
    workspace_id: str

class ServerConfig(BaseModel):
    """Single server in an environment."""
    name: str
    # Optional fields – not used yet in UI, but safe to keep
    old_folder: str = ""
    new_folder: str = ""
    excel_path: str = ""


class EnvironmentConfig(BaseModel):
    """Environment (LAB / SIT / UAT / etc.) containing multiple servers."""
    name: str
    servers: List[ServerConfig] = Field(default_factory=list)


class WorkspaceCreateRequest(BaseModel):
    """Request model for creating a workspace (project)."""
    name: str                               # project/workspace id
    project_name: Optional[str] = ""        # display name; can equal `name`
    # legacy single-folder fields (keep for compatibility)
    old_folder: Optional[str] = ""
    new_folder: Optional[str] = ""
    excel_path: Optional[str] = ""
    # new hierarchical structure
    environments: List[EnvironmentConfig] = Field(default_factory=list)


class WorkspaceResponse(BaseModel):
    """Response model for workspace data."""
    name: str
    project_name: Optional[str] = ""
    old_folder: str = ""
    new_folder: str = ""
    excel_path: str = ""
    environments: List[EnvironmentConfig] = Field(default_factory=list)
    history: List[Dict[str, Any]] = Field(default_factory=list)

class WorkspaceUpdateRequest(BaseModel):
    """Partial update for workspace (used to update environments, names, etc.)."""
    project_name: Optional[str] = None
    old_folder: Optional[str] = None
    new_folder: Optional[str] = None
    excel_path: Optional[str] = None
    environments: Optional[List[EnvironmentConfig]] = None

class DeltaGroupFile(BaseModel):
    """Single SQL file in a delta group."""
    file_name: str
    relative_path: str
    full_path: str


class DeltaGroup(BaseModel):
    """A delta group folder under DeltaDrop (e.g., TableScripts, StoredProcedures)."""
    name: str
    files: List[DeltaGroupFile] = Field(default_factory=list)


class DeltaScanRequest(BaseModel):
    """
    Request for scanning a database DeltaDrop structure.

    root_folder: path to the DatabaseName folder
                 (the folder that contains BaseDrop and DeltaDrop)
    excel_path: optional Excel to write results into
    """
    root_folder: str
    excel_path: Optional[str] = ""


class DeltaScanResponse(BaseModel):
    """Response for delta scan (and optional Excel write)."""
    database_name: str
    groups: List[DeltaGroup]
    excel_written: bool
    message: str