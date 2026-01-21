"""
Service for managing workspaces.
Workspaces store comparison settings and history.
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
    """Ensure workspaces directory exists."""
    Path(WORKSPACES_DIR).mkdir(exist_ok=True)

def create_workspace(name: str, old_folder: str = "", new_folder: str = "", excel_path: str = "") -> Dict:
    """Create a new workspace."""
    ensure_workspaces_dir()
    workspace_dir = Path(WORKSPACES_DIR) / name
    workspace_dir.mkdir(exist_ok=True)
    
    metadata = {
        "name": name,
        "old_folder": old_folder,
        "new_folder": new_folder,
        "excel_path": excel_path,
        "history": []
    }
    
    with open(workspace_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    return metadata

def list_workspaces() -> List[str]:
    """List all workspace names."""
    ensure_workspaces_dir()
    workspaces_dir = Path(WORKSPACES_DIR)
    if not workspaces_dir.exists():
        return []
    return [d.name for d in workspaces_dir.iterdir() if d.is_dir()]

def get_workspace(name: str) -> Optional[Dict]:
    """Get workspace metadata."""
    workspace_dir = Path(WORKSPACES_DIR) / name
    metadata_file = workspace_dir / "metadata.json"
    if not metadata_file.exists():
        return None
    
    with open(metadata_file, "r") as f:
        return json.load(f)

def update_workspace(name: str, updates: Dict) -> bool:
    """Update workspace metadata."""
    workspace = get_workspace(name)
    if not workspace:
        return False
    
    workspace.update(updates)
    workspace_dir = Path(WORKSPACES_DIR) / name
    with open(workspace_dir / "metadata.json", "w") as f:
        json.dump(workspace, f, indent=2)
    
    return True

def add_comparison_to_history(workspace_name: str, comparison_result: Dict):
    """Add a comparison result to workspace history."""
    workspace = get_workspace(workspace_name)
    if workspace:
        workspace["history"].append(comparison_result)
        update_workspace(workspace_name, {"history": workspace["history"]})

# ✅ NEW
def delete_workspace(name: str) -> bool:
    """
    Delete a workspace directory (and its metadata/history).
    
    Returns:
        True if the workspace existed and was deleted, False otherwise.
    """
    ensure_workspaces_dir()
    workspace_dir = Path(WORKSPACES_DIR) / name
    if not workspace_dir.exists() or not workspace_dir.is_dir():
        return False

    try:
        shutil.rmtree(workspace_dir)
        return True
    except Exception:
        # you can log the error if you want
        return False