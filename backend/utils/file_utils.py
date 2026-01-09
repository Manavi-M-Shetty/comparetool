"""
File utilities for safe file operations with error handling.
Handles Windows paths, permission errors, and encoding issues.
"""
import os
from pathlib import Path
from typing import List, Optional, Tuple


def safe_read_file(file_path: str) -> Optional[List[str]]:
    """
    Safely read a file and return lines.
    Returns None if file cannot be read.
    
    Args:
        file_path: Path to the file
        
    Returns:
        List of lines or None if error
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.readlines()
    except (PermissionError, IOError, OSError) as e:
        print(f"Error reading {file_path}: {e}")
        return None


def safe_listdir(path: str) -> List[str]:
    """
    Safely list directory contents, skipping unreadable items.
    
    Args:
        path: Directory path
        
    Returns:
        List of directory entries
    """
    try:
        return [item for item in os.listdir(path) 
                if os.path.exists(os.path.join(path, item))]
    except (PermissionError, IOError, OSError):
        return []


def safe_isdir(path: str) -> bool:
    """
    Safely check if path is a directory.
    
    Args:
        path: Path to check
        
    Returns:
        True if directory, False otherwise
    """
    try:
        return os.path.isdir(path)
    except (PermissionError, IOError, OSError):
        return False


def get_filename(file_path: str) -> str:
    """
    Extract filename from full path.
    
    Args:
        file_path: Full file path
        
    Returns:
        Filename only
    """
    return os.path.basename(file_path)


def normalize_path(path: str) -> str:
    """
    Normalize Windows path separators.
    
    Args:
        path: Path string
        
    Returns:
        Normalized path
    """
    return os.path.normpath(path)


def path_exists(path: str) -> bool:
    """
    Safely check if path exists.
    
    Args:
        path: Path to check
        
    Returns:
        True if exists, False otherwise
    """
    try:
        return os.path.exists(path)
    except (PermissionError, IOError, OSError):
        return False
