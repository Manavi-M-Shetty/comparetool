"""
Pydantic schemas for API request/response models.
Defines all request/response data models used by FastAPI endpoints
for configuration file comparison, Excel operations, and workspace management.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CompareRequest(BaseModel):
    """Request to compare two individual config files by path."""
    old_path: str  # Path to the original/baseline file
    new_path: str  # Path to the changed/new file


class FilePair(BaseModel):
    """Model representing a matched file pair from folder comparison."""
    component_name: str       # Component folder name (e.g., subdirectory name)
    config_file_name: str     # The filename matched between old and new
    old_path: str             # Full path to file in old/baseline folder
    new_path: str             # Full path to file in new/changed folder


class DiffLine(BaseModel):
    """Model for a single line in a unified diff output."""
    line_type: str  # Type: 'added', 'removed', 'context', or 'header'
    content: str    # The line content (without leading +/- prefix)
    old_line_num: Optional[int] = None  # Line number in old file (if applicable)
    new_line_num: Optional[int] = None  # Line number in new file (if applicable)


class FileDiff(BaseModel):
    """Complete diff result for a single file including parsed and raw diff formats."""
    file_name: str                                    # Filename only
    component_name: str                               # Directory/component name for grouping
    has_changes: bool                                 # True if file contents differ
    diff_lines: List[DiffLine]                       # Structured diff lines for UI rendering
    unified_diff: List[str]                          # Raw unified diff output from difflib
    semantic_diff: Optional[Dict[str, Any]] = None  # Structured semantic changes (keys added/removed/modified)


class FileDiffSummary(BaseModel):
    """Lightweight diff summary used in folder comparison responses to avoid loading full diffs."""
    file_name: str            # Filename only
    component_name: str       # Component folder name
    has_changes: bool         # True if file differs
    summary: str              # Human-readable summary (e.g., "5 lines added; 2 removed")
    old_path: str             # Full path in old folder
    new_path: str             # Full path in new folder
    semantic_diff: Optional[Dict[str, Any]] = None  # Structured semantic changes dict


class CompareFoldersRequest(BaseModel):
    """Request to compare two entire folder hierarchies."""
    old_folder: str    # Path to baseline/original folder
    new_folder: str    # Path to changed/new folder
    workspace_id: str  # Associated workspace identifier




class FolderNode(BaseModel):
    """Nested folder tree node mirroring directory hierarchy."""
    name: str  # Folder name (basename only)
    path: str  # Full normalized path
    subfolders: List["FolderNode"] = Field(default_factory=list)  # Nested subfolders
    files: List[Dict[str, Any]] = Field(default_factory=list)  # Files in this folder


class MissingFileEntry(BaseModel):
    """Represents a file that exists only on one side of the comparison."""
    file_path: str        # Full path to the file
    component_name: str   # Component/directory name
    missing_side: str     # Which side is missing: 'OLD' or 'NEW'
    validated: bool = False  # Whether user has reviewed/acknowledged this file


class CompareFoldersResponse(BaseModel):
    """Complete response for folder comparison with tree structure and file details."""
    total_components: int           # Total number of unique components found
    components_with_changes: int    # Number of components that have file changes
    folder_tree: FolderNode         # Hierarchical tree structure mirroring old folder
    file_summaries: List[FileDiffSummary]  # Summary of all file comparisons
    old_only_files: List[MissingFileEntry]  # Files that exist only in old folder
    new_only_files: List[MissingFileEntry]  # Files that exist only in new folder
    errors: List[str]               # Any errors encountered during comparison
    summary: List[str]              # Human-readable summary messages


FolderNode.update_forward_refs()


class UpdateExcelRequest(BaseModel):
    """Request to update an Excel file with comparison results."""
    excel_path: str                                               # Path to Excel workbook to update
    file_diffs: List[FileDiff]                                   # Full diff data for each changed file
    comments: Optional[Dict[str, Dict[str, str]]] = None  # Optional comments: {file_path: {key: text}}


class UpdateExcelResponse(BaseModel):
    """Response confirming Excel file update."""
    success: bool      # True if update succeeded
    message: str       # Status/error message
    updated_rows: int  # Number of rows added/modified in Excel


class ScanFoldersRequest(BaseModel):
    """Request to scan and match files between two folders."""
    old_folder: str  # Baseline folder path
    new_folder: str  # Changed folder path


class ScanFoldersResponse(BaseModel):
    """Response with folder scan results and file matching."""
    matched_pairs: List[FilePair]           # File pairs found in both folders
    old_only_files: List[MissingFileEntry]  # Files only in old folder
    new_only_files: List[MissingFileEntry]  # Files only in new folder


class WriteChangesRequest(BaseModel):
    """Request to write reviewed changes to Excel."""
    excel_path: str                      # Path to Excel workbook
    changes: List[Dict[str, str]]  # List of reviewed/approved changes


class WriteChangesResponse(BaseModel):
    """Response for write changes operation."""
    success: bool      # True if write succeeded
    message: str       # Status/error message
    written_rows: int  # Number of rows written to Excel


class CompareAndUpdateRequest(BaseModel):
    """Request to compare folders and optionally update Excel in one operation."""
    old_folder: str                                   # Baseline folder path
    new_folder: str                                   # Changed folder path
    excel_path: str                                   # Path to Excel file to update (optional)
    missing_validations: Optional[List[str]] = []    # User-confirmed missing file validations
    comments: Optional[Dict[str, Dict[str, str]]] = {}  # Optional review comments by file
    workspace_id: str                                 # Associated workspace identifier

class ServerConfig(BaseModel):
    """Configuration for a single server within an environment."""
    name: str                    # Server identifier (e.g., "Server1", "Instance1")
    old_folder: str = ""         # Baseline folder path (optional, for future use)
    new_folder: str = ""         # Changed folder path (optional, for future use)
    excel_path: str = ""         # Excel workbook path (optional, for future use)


class EnvironmentConfig(BaseModel):
    """Configuration for a test environment containing multiple servers."""
    name: str  # Environment name (e.g., "LAB", "SIT", "UAT", "PROD")
    servers: List[ServerConfig] = Field(default_factory=list)  # Servers in this environment


class WorkspaceCreateRequest(BaseModel):
    """Request to create a new workspace (project configuration)."""
    name: str                               # Workspace identifier/slug
    project_name: Optional[str] = ""        # Display name (defaults to name if not provided)
    # Legacy single-folder fields (kept for backward compatibility)
    old_folder: Optional[str] = ""          # Baseline folder path (deprecated)
    new_folder: Optional[str] = ""          # Changed folder path (deprecated)
    excel_path: Optional[str] = ""          # Excel workbook path (deprecated)
    # New hierarchical structure for multi-environment/server support
    environments: List[EnvironmentConfig] = Field(default_factory=list)


class WorkspaceResponse(BaseModel):
    """Response containing complete workspace configuration."""
    name: str                               # Workspace identifier
    project_name: Optional[str] = ""        # Display name
    old_folder: str = ""                    # Baseline folder path (legacy)
    new_folder: str = ""                    # Changed folder path (legacy)
    excel_path: str = ""                    # Excel workbook path (legacy)
    environments: List[EnvironmentConfig] = Field(default_factory=list)  # Environments and servers
    history: List[Dict[str, Any]] = Field(default_factory=list)  # Comparison history


class WorkspaceUpdateRequest(BaseModel):
    """Request to update existing workspace configuration (partial update)."""
    project_name: Optional[str] = None       # New display name
    old_folder: Optional[str] = None         # New baseline folder
    new_folder: Optional[str] = None         # New changed folder
    excel_path: Optional[str] = None         # New Excel path
    environments: Optional[List[EnvironmentConfig]] = None  # Updated environments list


class DeltaGroupFile(BaseModel):
    """Single SQL script file within a delta group."""
    file_name: str        # Filename only
    relative_path: str    # Path relative to DeltaDrop root
    full_path: str        # Absolute path to file


class DeltaGroup(BaseModel):
    """A delta group folder under DeltaDrop (e.g., TableScripts, StoredProcedures, Functions)."""
    name: str                                      # Group name (subfolder name under DeltaDrop)
    files: List[DeltaGroupFile] = Field(default_factory=list)  # SQL files in this group


class DeltaScanRequest(BaseModel):
    """Request to scan a database delta structure for SQL migration scripts."""
    root_folder: str             # Path to database root (contains BaseDrop and DeltaDrop folders)
    excel_path: Optional[str] = ""  # Optional: path to Excel file for results


class DeltaScanResponse(BaseModel):
    """Response from database delta scan operation."""
    database_name: str        # Extracted database name from folder
    groups: List[DeltaGroup]  # Delta group folders found
    excel_written: bool       # True if results were written to Excel
    message: str              # Status or error message