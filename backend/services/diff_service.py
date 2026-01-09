"""
Service for generating diffs between files using difflib.
Produces unified diff format and parsed diff lines for UI display.
"""
import os
import sys
import difflib
from typing import List, Dict, Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.file_utils import safe_read_file
from models.schemas import FileDiff, DiffLine


def parse_unified_diff(unified_diff: List[str]) -> List[DiffLine]:
    """
    Parse unified diff output into structured DiffLine objects.
    
    Args:
        unified_diff: List of unified diff lines
        
    Returns:
        List of DiffLine objects
    """
    diff_lines = []
    old_line_num = None
    new_line_num = None
    
    for line in unified_diff:
        if line.startswith("---") or line.startswith("+++"):
            # Header lines
            diff_lines.append(DiffLine(
                line_type="header",
                content=line,
                old_line_num=None,
                new_line_num=None
            ))
        elif line.startswith("@@"):
            # Hunk header - extract line numbers
            diff_lines.append(DiffLine(
                line_type="header",
                content=line,
                old_line_num=None,
                new_line_num=None
            ))
            # Parse line numbers from hunk header
            try:
                parts = line.split("@@")[1].strip().split()
                if len(parts) >= 2:
                    old_part = parts[0].lstrip("-")
                    new_part = parts[1].lstrip("+")
                    if "," in old_part:
                        old_line_num = int(old_part.split(",")[0])
                    else:
                        old_line_num = int(old_part) if old_part else None
                    if "," in new_part:
                        new_line_num = int(new_part.split(",")[0])
                    else:
                        new_line_num = int(new_part) if new_part else None
            except (ValueError, IndexError):
                pass
        elif line.startswith("-"):
            # Removed line
            diff_lines.append(DiffLine(
                line_type="removed",
                content=line[1:] if len(line) > 1 else "",
                old_line_num=old_line_num,
                new_line_num=None
            ))
            if old_line_num is not None:
                old_line_num += 1
        elif line.startswith("+"):
            # Added line
            diff_lines.append(DiffLine(
                line_type="added",
                content=line[1:] if len(line) > 1 else "",
                old_line_num=None,
                new_line_num=new_line_num
            ))
            if new_line_num is not None:
                new_line_num += 1
        elif line.startswith(" "):
            # Context line (unchanged)
            diff_lines.append(DiffLine(
                line_type="context",
                content=line[1:] if len(line) > 1 else "",
                old_line_num=old_line_num,
                new_line_num=new_line_num
            ))
            if old_line_num is not None:
                old_line_num += 1
            if new_line_num is not None:
                new_line_num += 1
        else:
            # Other lines (empty, etc.)
            diff_lines.append(DiffLine(
                line_type="context",
                content=line,
                old_line_num=None,
                new_line_num=None
            ))
    
    return diff_lines


def compare_files(old_path: str, new_path: str) -> Optional[FileDiff]:
    """
    Compare two files and generate diff.
    
    Args:
        old_path: Path to old file
        new_path: Path to new file
        
    Returns:
        FileDiff object or None if error
    """
    old_lines = safe_read_file(old_path)
    new_lines = safe_read_file(new_path)
    
    if old_lines is None:
        return None
    if new_lines is None:
        return None
    
    # Generate unified diff
    unified_diff = list(difflib.unified_diff(
        old_lines,
        new_lines,
        fromfile=os.path.basename(old_path),
        tofile=os.path.basename(new_path),
        lineterm=""
    ))
    
    # Check if there are actual changes (not just headers)
    has_changes = len([line for line in unified_diff 
                      if line.startswith(("+", "-")) and not line.startswith(("+++", "---"))]) > 0
    
    # Parse diff lines
    diff_lines = parse_unified_diff(unified_diff)
    
    return FileDiff(
        file_name=os.path.basename(old_path),
        component_name="",  # Will be set by caller
        has_changes=has_changes,
        diff_lines=diff_lines,
        unified_diff=unified_diff
    )


def generate_diff_summary(file_diff: FileDiff) -> str:
    """
    Generate a human-readable summary of changes.
    
    Args:
        file_diff: FileDiff object
        
    Returns:
        Summary string
    """
    if not file_diff.has_changes:
        return "No changes detected"
    
    added = sum(1 for line in file_diff.diff_lines if line.line_type == "added")
    removed = sum(1 for line in file_diff.diff_lines if line.line_type == "removed")
    
    parts = []
    if added > 0:
        parts.append(f"{added} line(s) added")
    if removed > 0:
        parts.append(f"{removed} line(s) removed")
    
    return "; ".join(parts) if parts else "Changes detected"
