"""
File utilities for safe file operations with error handling.
Provides robust wrappers around OS file operations that gracefully handle
Windows paths, permission errors, encoding issues, and missing files.
"""
import os
from pathlib import Path
from typing import List, Optional, Tuple


def safe_read_file(file_path: str) -> Optional[List[str]]:
    """
    Safely read a file and return its contents as lines.
    Handles encoding errors gracefully and catches OS-level exceptions.
    
    Args:
        file_path: Path to the file to read
        
    Returns:
        List of file lines, or None if file cannot be read
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.readlines()
    except (PermissionError, IOError, OSError) as e:
        print(f"Error reading {file_path}: {e}")
        return None


def safe_listdir(path: str) -> List[str]:
    """
    Safely list directory contents, filtering out inaccessible items.
    
    Args:
        path: Directory path to list
        
    Returns:
        List of accessible directory entries, or empty list on error
    """
    try:
        return [item for item in os.listdir(path) 
                if os.path.exists(os.path.join(path, item))]
    except (PermissionError, IOError, OSError):
        return []


def safe_isdir(path: str) -> bool:
    """
    Safely check whether a path points to a directory.
    
    Args:
        path: Path to check
        
    Returns:
        True if path is a directory, False otherwise or on error
    """
    try:
        return os.path.isdir(path)
    except (PermissionError, IOError, OSError):
        return False


def get_filename(file_path: str) -> str:
    """
    Extract the filename component from a full file path.
    
    Args:
        file_path: Full path to file
        
    Returns:
        Filename portion only (basename)
    """
    return os.path.basename(file_path)


def normalize_path(path: str) -> str:
    """
    Normalize path separators for the current OS.
    Converts forward slashes to backslashes on Windows.
    
    Args:
        path: Path string to normalize
        
    Returns:
        Normalized path with OS-appropriate separators
    """
    return os.path.normpath(path)


def path_exists(path: str) -> bool:
    """
    Safely check whether a path exists without raising exceptions.
    
    Args:
        path: Path to check
        
    Returns:
        True if path exists and is accessible, False otherwise
    """
    try:
        return os.path.exists(path)
    except (PermissionError, IOError, OSError):
        return False


def get_component_name(file_path: str) -> str:
    """
    Extract component name from file path based on standard folder structure.
    
    Logic:
    - If path contains /binaries/ → returns first folder under binaries
    - If path contains /configs/ → returns first folder under configs
    - Otherwise → returns 'unknown'
    
    Args:
        file_path: Normalized file path
        
    Returns:
        Component name string
    """
    normalized_path = normalize_path(file_path).replace('\\', '/')
    
    if '/binaries/' in normalized_path:
        parts = normalized_path.split('/binaries/')[1].split('/')
        return parts[0] if parts else 'unknown'
    elif '/configs/' in normalized_path:
        parts = normalized_path.split('/configs/')[1].split('/')
        return parts[0] if parts else 'unknown'
    else:
        return 'unknown'
