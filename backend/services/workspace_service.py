"""
Service for managing workspaces and their configuration.
Workspaces store project metadata, environments, servers, and comparison history.
Persists configuration to JSON metadata files in the workspaces directory.
"""

import os
import sys
import json
import shutil
from typing import Dict, List, Optional
from pathlib import Path


def _get_default_workspaces_dir() -> str:
    """
    Return a filesystem path where workspaces should be stored.

    - When running from a PyInstaller EXE, use a per-user directory
      (e.g. %LOCALAPPDATA%\ConfigCompareTool\workspaces).
    - When running from source, keep the old backend/workspaces directory.
    """
    # Running from a PyInstaller-built executable?
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        local_appdata = os.getenv("LOCALAPPDATA") or os.path.expanduser("~")
        base = Path(local_appdata) / "ConfigCompareTool"
        return str(base / "workspaces")
    else:
        # Normal source run: previous behaviour
        return os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "workspaces",
        )


WORKSPACES_DIR = _get_default_workspaces_dir()


def ensure_workspaces_dir():
    """Ensure the workspaces directory exists; creates it if necessary."""
    Path(WORKSPACES_DIR).mkdir(parents=True, exist_ok=True)


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
    """
    ensure_workspaces_dir()
    workspaces_dir = Path(WORKSPACES_DIR)
    if not workspaces_dir.exists():
        return []
    return [d.name for d in workspaces_dir.iterdir() if d.is_dir()]


def get_workspace(name: str) -> Optional[Dict]:
    """
    Retrieve complete metadata for a workspace.
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
    """
    workspace = get_workspace(name)
    if not workspace:
        return False

    workspace.update(updates)
    workspace_dir = Path(WORKSPACES_DIR) / name
    with open(workspace_dir / "metadata.json", "w") as f:
        json.dump(workspace, f, indent=2)

    return True


def add_comparison_to_history(workspace_name: str, comparison_result: Dict):
    """
    Add a comparison result to the workspace's history.
    """
    workspace = get_workspace(workspace_name)
    if workspace:
        workspace["history"].append(comparison_result)
        update_workspace(workspace_name, {"history": workspace["history"]})


def find_server_config(
    workspace: Dict, env_name: str, server_name: str
) -> Optional[Dict]:
    """
    Find a server configuration within a workspace by environment and server name.
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