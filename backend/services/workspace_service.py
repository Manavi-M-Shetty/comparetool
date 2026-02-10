"""
Service for managing workspaces and their configuration.
Workspaces store project metadata, environments, servers, and comparison history.
Persists configuration to JSON metadata files in the workspaces directory.
"""
import os
import json
import shutil                      # ✅ add this
from typing import Dict, List, Optional
from pathlib import Path

WORKSPACES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "workspaces"
)

def ensure_workspaces_dir():
    """Ensure the workspaces directory exists; creates it if necessary."""
    Path(WORKSPACES_DIR).mkdir(exist_ok=True)

def create_workspace(
    name: str,
    old_folder: str = "",
    new_folder: str = "",
    excel_path: str = "",
    project_name: str = "",
    environments: Optional[List[Dict]] = None,
) -> Dict:
    """
    Create a new workspace with configuration metadata.
    
    Supports both legacy single-folder configuration (old_folder/new_folder/excel_path)
    and new hierarchical configuration with multiple environments and servers.
    
    Args:
        name: Unique workspace identifier
        old_folder: Baseline folder path (legacy field)
        new_folder: Changed folder path (legacy field)
        excel_path: Excel workbook path (legacy field)
        project_name: Display name for the project
        environments: List of environment configurations (new hierarchical model)
        
    Returns:
        Dictionary containing complete workspace metadata
    """
    ensure_workspaces_dir()
    workspace_dir = Path(WORKSPACES_DIR) / name
    workspace_dir.mkdir(exist_ok=True)

    metadata = {
        "name": name,
        "project_name": project_name or name,
        # Legacy single-folder config (maintained for backward compatibility)
        "old_folder": old_folder,
        "new_folder": new_folder,
        "excel_path": excel_path,
        # New hierarchical multi-environment config
        "environments": environments or [],
        # Historical record of comparisons performed
        "history": [],
    }

    with open(workspace_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def list_workspaces() -> List[str]:
    """
    Retrieve all workspace names.
    
    Returns:
        List of workspace identifiers (directory names)
    """
    ensure_workspaces_dir()
    workspaces_dir = Path(WORKSPACES_DIR)
    if not workspaces_dir.exists():
        return []
    return [d.name for d in workspaces_dir.iterdir() if d.is_dir()]

def get_workspace(name: str) -> Optional[Dict]:
    """
    Retrieve complete metadata for a workspace.
    
    Args:
        name: Workspace identifier
        
    Returns:
        Dictionary with workspace configuration, or None if not found
    """
    workspace_dir = Path(WORKSPACES_DIR) / name
    metadata_file = workspace_dir / "metadata.json"
    if not metadata_file.exists():
        return None
    
    with open(metadata_file, "r") as f:
        return json.load(f)

def update_workspace(name: str, updates: Dict) -> bool:
    """
    Update workspace metadata with new values.
    Performs a shallow merge of provided updates into existing metadata.
    
    Args:
        name: Workspace identifier
        updates: Dictionary of fields to update
        
    Returns:
        True if update successful, False if workspace not found
    """
    workspace = get_workspace(name)
    if not workspace:
        return False
    
    # Merge updates into existing workspace metadata
    workspace.update(updates)
    workspace_dir = Path(WORKSPACES_DIR) / name
    with open(workspace_dir / "metadata.json", "w") as f:
        json.dump(workspace, f, indent=2)
    
    return True

def add_comparison_to_history(workspace_name: str, comparison_result: Dict):
    """
    Add a comparison result to the workspace's history.
    Appends the result and updates the workspace metadata.
    
    Args:
        workspace_name: Workspace identifier
        comparison_result: Dictionary with comparison details to record
    """
    workspace = get_workspace(workspace_name)
    if workspace:
        workspace["history"].append(comparison_result)
        update_workspace(workspace_name, {"history": workspace["history"]})


def find_server_config(workspace: Dict, env_name: str, server_name: str) -> Optional[Dict]:
    """
    Find a server configuration within a workspace by environment and server name.
    
    Args:
        workspace: Workspace metadata dictionary
        env_name: Environment name to search
        server_name: Server name to search
        
    Returns:
        Server configuration dictionary, or None if not found
    """
    for env in workspace.get("environments", []):
        if env.get("name") == env_name:
            for srv in env.get("servers", []):
                if srv.get("name") == server_name:
                    return srv
    return None

def delete_workspace(name: str) -> bool:
    """
    Delete a workspace and all its metadata.
    Removes the entire workspace directory tree.
    
    Args:
        name: Workspace identifier
        
    Returns:
        True if workspace existed and was deleted, False if not found
    """
    ensure_workspaces_dir()
    workspace_dir = Path(WORKSPACES_DIR) / name
    if not workspace_dir.exists() or not workspace_dir.is_dir():
        return False

    try:
        shutil.rmtree(workspace_dir)
        return True
    except Exception:
        return False