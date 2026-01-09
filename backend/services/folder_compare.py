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


def scan_configs(root: str) -> Dict[str, List[str]]:
    """
    Recursively scan folder structure to find components and their config files.
    Components are identified by subfolder names.
    
    Args:
        root: Root folder path
        
    Returns:
        Dictionary mapping component names to lists of config file paths
    """
    components = {}
    
    if not path_exists(root) or not safe_isdir(root):
        return components
    
    try:
        entries = safe_listdir(root)
        
        for entry in entries:
            comp_path = os.path.join(root, entry)
            
            # Only process directories (components)
            if safe_isdir(comp_path):
                files = []
                
                # Recursively walk through component directory
                try:
                    for root_dir, dirs, file_list in os.walk(comp_path):
                        for file_name in file_list:
                            file_path = os.path.join(root_dir, file_name)
                            # Only include files (skip directories)
                            if os.path.isfile(file_path):
                                files.append(normalize_path(file_path))
                except (PermissionError, IOError, OSError) as e:
                    print(f"Error scanning {comp_path}: {e}")
                    continue
                
                if files:
                    components[entry] = files
                    
    except (PermissionError, IOError, OSError) as e:
        print(f"Error scanning root {root}: {e}")
    
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
