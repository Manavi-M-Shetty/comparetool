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
from services.semantic_diff import semantic_compare_files


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
    Note: This function reads files into memory to produce a unified diff suitable for single-file views.
    """
    old_lines = safe_read_file(old_path)
    new_lines = safe_read_file(new_path)
    
    if old_lines is None or new_lines is None:
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
    has_changes = any(
        line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
        for line in unified_diff
    )
    
    # Parse diff lines
    diff_lines = parse_unified_diff(unified_diff)

    # Attempt semantic diff (JSON/XML/key-value aware)
    try:
        semantic = semantic_compare_files(old_path, new_path)
    except Exception:
        semantic = None

    return FileDiff(
        file_name=os.path.basename(old_path),
        component_name="",  # Will be set by caller
        has_changes=has_changes,
        diff_lines=diff_lines,
        unified_diff=unified_diff,
        semantic_diff=semantic
    )


def compare_files_metadata(old_path: str, new_path: str, max_semantic_bytes: int = 200 * 1024) -> Optional[dict]:
    """
    Lightweight, memory-safe comparison of two files that avoids building full diffs.
    - Streams files in binary chunks to detect any change without loading entire files into memory.
    - Uses size quick checks first and then a chunked comparison if sizes match.
    - Attempts limited semantic parsing only for small files (<= max_semantic_bytes).

    Returns a dict with keys: has_changes (bool), summary (str), semantic_summary (dict)
    """
    try:
        # Quick size check
        s_old = os.path.getsize(old_path)
        s_new = os.path.getsize(new_path)
    except FileNotFoundError:
        return None

    # If sizes differ -> changed
    if s_old != s_new:
        has_changes = True
        summary = "Size differs"
    else:
        # Sizes equal -> do a streaming binary compare in chunks (memory-safe)
        has_changes = False
        BUF = 8192
        try:
            with open(old_path, 'rb') as fo, open(new_path, 'rb') as fn:
                while True:
                    bo = fo.read(BUF)
                    bn = fn.read(BUF)
                    if not bo and not bn:
                        break
                    if bo != bn:
                        has_changes = True
                        break
        except FileNotFoundError:
            return None
        except Exception:
            return None

        summary = "No changes detected" if not has_changes else "Content differs"

    # Semantic parse only for small files to avoid memory issues
    semantic_summary = {}
    if s_old <= max_semantic_bytes and s_new <= max_semantic_bytes:
        try:
            sem = semantic_compare_files(old_path, new_path)
            if isinstance(sem, dict):
                semantic_summary = {
                    "changes_count": len(sem.get('changes', [])) if sem.get('changes') else 0,
                    "summary": sem.get('summary', {})
                }
            else:
                semantic_summary = {"note": "semantic parse returned unexpected format"}
        except Exception:
            semantic_summary = {"note": "semantic parse failed"}
    else:
        semantic_summary = {"note": "skipped (file too large)"}

    return {"has_changes": has_changes, "summary": summary, "semantic_summary": semantic_summary}


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
