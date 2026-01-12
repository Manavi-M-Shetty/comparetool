"""
Service for comparing folders and matching components/files.
Matches components by subfolder name and config files by filename.
"""
import os
import sys
from typing import Dict, List, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.file_utils import (
    safe_listdir, safe_isdir, get_filename, 
    normalize_path, path_exists
)


ALLOWED_EXTENSIONS = {'.json', '.xml', '.yml', '.yaml', '.ini', '.cfg', '.conf', '.txt', '.env', '.properties', '.csv', '.xlsx','.config'}


def is_config_file(path: str) -> bool:
    """Return True if the file has an allowed config extension."""
    _, ext = os.path.splitext(path)
    return ext.lower() in ALLOWED_EXTENSIONS


def is_probably_binary(path: str, sniff_bytes: int = 4096) -> bool:
    """Heuristic: read first chunk and check for NUL bytes."""
    try:
        with open(path, 'rb') as f:
            chunk = f.read(sniff_bytes)
            return b"\x00" in chunk
    except Exception:
        return True


def build_folder_tree(root: str) -> dict:
    """
    Build a nested folder tree dict that mirrors the directory hierarchy of `root`.
    Each directory node is: {name, path, subfolders: [...], files: [{file_name, path}]}
    Preserves the order as returned by the filesystem (do not sort so caller's folder order is preserved).
    Only includes files with allowed extensions and skips probable binary files.
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

        # Preserve the filesystem order by iterating entries as-is
        for entry in entries:
            abs_path = os.path.join(current_path, entry)
            if safe_isdir(abs_path):
                node["subfolders"].append(build_node(abs_path))
            else:
                # Only include allowed config files and skip binary
                if is_config_file(entry) and not is_probably_binary(abs_path):
                    node["files"].append({"file_name": entry, "path": normalize_path(abs_path)})

        return node

    if not path_exists(root) or not safe_isdir(root):
        return {"name": os.path.basename(root) or root, "path": normalize_path(root), "subfolders": [], "files": []}

    return build_node(root)


def scan_configs(root: str) -> Dict[str, List[str]]:
    """
    Recursively scan root and return mapping of component (directory basename) to list of config file paths.
    Only includes allowed config extensions and skips binary files.
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
) -> Tuple[List[Dict], List[str], List[str]]:
    """
    Match components and config files between old and new folders.
    
    Args:
        old_root: Path to old folder
        new_root: Path to new folder
        
    Returns:
        Tuple of (matched_pairs, old_only_components, new_only_components)
        matched_pairs: List of dicts with component_name, config_file_name, old_path, new_path
    """
    old_components = scan_configs(old_root)
    new_components = scan_configs(new_root)
    
    matched_pairs = []
    old_only = []
    new_only = []
    
    # Find all unique component names
    all_components = set(old_components.keys()) | set(new_components.keys())
    
    for comp_name in all_components:
        old_files = old_components.get(comp_name, [])
        new_files = new_components.get(comp_name, [])
        
        if not old_files and new_files:
            new_only.append(comp_name)
            continue
        elif old_files and not new_files:
            old_only.append(comp_name)
            continue
        
        # Match files by filename within each component
        old_file_map = {get_filename(f): f for f in old_files}
        new_file_map = {get_filename(f): f for f in new_files}
        
        # Find matched files
        matched_filenames = set(old_file_map.keys()) & set(new_file_map.keys())
        
        for filename in matched_filenames:
            matched_pairs.append({
                "component_name": comp_name,
                "config_file_name": filename,
                "old_path": old_file_map[filename],
                "new_path": new_file_map[filename]
            })
    
    return matched_pairs, old_only, new_only
