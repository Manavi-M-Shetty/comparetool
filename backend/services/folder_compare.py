"""
Service for comparing folder hierarchies and matching configuration files.
Recursively scans folders, matches components by folder name, and files by filename.
Only processes files with allowed configuration extensions and filters out binary files.
"""
import os
import sys
from typing import Dict, List, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ..utils.file_utils import (
    safe_listdir, safe_isdir, get_filename, 
    normalize_path, path_exists
)


# Supported configuration file extensions
ALLOWED_EXTENSIONS = {'.json', '.xml', '.yml', '.yaml', '.ini', '.cfg', '.conf', '.txt', '.env', '.properties', '.csv', '.xlsx','.config'}


def is_config_file(path: str) -> bool:
    """
    Check if a file has an allowed configuration extension.
    
    Args:
        path: File path or filename
        
    Returns:
        True if file extension is in ALLOWED_EXTENSIONS
    """
    _, ext = os.path.splitext(path)
    return ext.lower() in ALLOWED_EXTENSIONS


def is_probably_binary(path: str, sniff_bytes: int = 4096) -> bool:
    """
    Detect if a file is likely binary by checking for NUL bytes.
    This heuristic helps avoid processing binary files as text.
    
    Args:
        path: File path to check
        sniff_bytes: Number of bytes to read for detection (default 4096)
        
    Returns:
        True if binary content is detected or file cannot be read
    """
    try:
        with open(path, 'rb') as f:
            chunk = f.read(sniff_bytes)
            return b"\x00" in chunk
    except Exception:
        return True


def build_folder_tree(root: str) -> dict:
    """
    Build a nested folder tree structure mirroring the directory hierarchy.
    Recursively processes all subdirectories while filtering config files.
    
    Includes:
    - Folders with allowed extension files
    - Config files (JSON, XML, YAML, INI, etc.)
    Excludes:
    - Binary files (detected by NUL byte heuristic)
    
    Args:
        root: Root folder path
        
    Returns:
        Nested dictionary with structure:
        {
            "name": "folder_name",
            "path": "normalized_path",
            "subfolders": [...],
            "files": [{"file_name": "x.json", "path": "..."}]
        }
    """
    def build_node(current_path: str):
        node = {
            "name": os.path.basename(current_path),
            "path": normalize_path(current_path),
            "subfolders": [],
            "files": []
        }

        try:
            entries = os.listdir(current_path)
        except Exception:
            entries = []

        # Process all entries preserving filesystem order
        for entry in entries:
            abs_path = os.path.join(current_path, entry)
            if safe_isdir(abs_path):
                node["subfolders"].append(build_node(abs_path))
            else:
                # Include only allowed config files, excluding binaries
                if is_config_file(entry) and not is_probably_binary(abs_path):
                    node["files"].append({"file_name": entry, "path": normalize_path(abs_path)})

        return node

    if not path_exists(root) or not safe_isdir(root):
        return {"name": os.path.basename(root) or root, "path": normalize_path(root), "subfolders": [], "files": []}

    return build_node(root)


def scan_configs(root: str) -> Dict[str, List[str]]:
    """
    Scan folder recursively and map component names to config file paths.
    Each component is identified by its directory basename.
    Multiple files in the same component are aggregated into a list.
    
    Args:
        root: Root folder path
        
    Returns:
        Dictionary mapping component name -> list of config file paths
    """
    components: Dict[str, List[str]] = {}
    if not path_exists(root) or not safe_isdir(root):
        return components

    for dirpath, dirnames, filenames in os.walk(root):
        comp_name = os.path.basename(dirpath) or dirpath
        files = []
        for fname in filenames:
            if not is_config_file(fname):
                continue
            file_path = os.path.join(dirpath, fname)
            if os.path.isfile(file_path) and not is_probably_binary(file_path):
                files.append(normalize_path(file_path))
        if files:
            components.setdefault(comp_name, []).extend(files)

    return components

def match_file_pairs(
    old_root: str, 
    new_root: str
) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Match config files between old and new folders by component and filename.
    
    Matching logic:
    1. Components are identified by folder basename (e.g., "Server1", "Service2")
    2. Files within each component are matched by filename
    3. Missing files (existing in only one folder) are tracked separately
    
    Args:
        old_root: Path to baseline/original folder
        new_root: Path to changed/new folder
        
    Returns:
        Tuple of three lists:
        - matched_pairs: [{"component_name", "config_file_name", "old_path", "new_path"}]
        - old_only_files: [{"file_path", "component_name", "missing_side": "NEW", "validated"}]
        - new_only_files: [{"file_path", "component_name", "missing_side": "OLD", "validated"}]
    """
    old_components = scan_configs(old_root)
    new_components = scan_configs(new_root)

    matched_pairs = []
    old_only_files = []
    new_only_files = []

    # Process all unique components found in either folder
    all_components = set(old_components.keys()) | set(new_components.keys())

    for comp_name in all_components:
        old_files = old_components.get(comp_name, [])
        new_files = new_components.get(comp_name, [])

        # Component exists only in NEW: all files are new
        if not old_files and new_files:
            for f in new_files:
                new_only_files.append({
                    "file_path": f,
                    "component_name": comp_name,
                    "missing_side": "OLD",
                    "validated": False
                })
            continue
        
        # Component exists only in OLD: all files are deleted
        elif old_files and not new_files:
            for f in old_files:
                old_only_files.append({
                    "file_path": f,
                    "component_name": comp_name,
                    "missing_side": "NEW",
                    "validated": False
                })
            continue

        # Component exists in both: match files by filename
        old_file_map = {get_filename(f): f for f in old_files}
        new_file_map = {get_filename(f): f for f in new_files}

        # Files present in both old and new
        matched_filenames = set(old_file_map.keys()) & set(new_file_map.keys())

        for filename in matched_filenames:
            matched_pairs.append({
                "component_name": comp_name,
                "config_file_name": filename,
                "old_path": old_file_map[filename],
                "new_path": new_file_map[filename]
            })

        # Files present in old but not in new for this component
        for filename, fpath in old_file_map.items():
            if filename not in matched_filenames:
                old_only_files.append({
                    "file_path": fpath,
                    "component_name": comp_name,
                    "missing_side": "NEW",
                    "validated": False
                })

        # Files present in new but not in old for this component
        for filename, fpath in new_file_map.items():
            if filename not in matched_filenames:
                new_only_files.append({
                    "file_path": fpath,
                    "component_name": comp_name,
                    "missing_side": "OLD",
                    "validated": False
                })

    return matched_pairs, old_only_files, new_only_files