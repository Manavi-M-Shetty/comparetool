"""
Service for generating unified diffs between files.
Parses unified diff output into structured diff line objects for UI rendering.
Integrates semantic diff parsing for JSON, XML, and key-value configuration files.
"""

import os
import difflib
from typing import List, Dict, Optional

from ..utils.file_utils import safe_read_file
from ..models.schemas import FileDiff, DiffLine
from .semantic_diff import semantic_compare_files


def parse_unified_diff(unified_diff: List[str]) -> List[DiffLine]:
    """
    Parse unified diff output into structured DiffLine objects for UI rendering.
    Extracts line numbers and categorizes lines by type (added, removed, context, header).

    Parses hunk headers (@@) to extract starting line numbers for both old and new files,
    then tracks line numbers as context/added/removed lines are processed.

    Args:
        unified_diff: List of lines from unified diff output

    Returns:
        List of DiffLine objects with parsed content and line numbers
    """
    diff_lines: List[DiffLine] = []
    old_line_num: Optional[int] = None
    new_line_num: Optional[int] = None

    for line in unified_diff:
        if line.startswith("---") or line.startswith("+++"):
            # File header lines (---/+++ prefixes)
            diff_lines.append(
                DiffLine(
                    line_type="header",
                    content=line,
                    old_line_num=None,
                    new_line_num=None,
                )
            )
        elif line.startswith("@@"):
            # Hunk header: extract starting line numbers for both files
            diff_lines.append(
                DiffLine(
                    line_type="header",
                    content=line,
                    old_line_num=None,
                    new_line_num=None,
                )
            )
            # Parse hunk header for line numbers
            try:
                parts = line.split("@@")[1].strip().split()
                if len(parts) >= 2:
                    old_part = parts[0].lstrip("-")
                    new_part = parts[1].lstrip("+")

                    # Extract starting line number (handle both "start" and "start,count" formats)
                    if "," in old_part:
                        old_line_num = int(old_part.split(",")[0])
                    else:
                        old_line_num = int(old_part) if old_part else None

                    if "," in new_part:
                        new_line_num = int(new_part.split(",")[0])
                    else:
                        new_line_num = int(new_part) if new_part else None
            except (ValueError, IndexError):
                # If parsing fails, just leave line numbers as-is
                pass
        elif line.startswith("-"):
            # Removed line: exists in old file
            diff_lines.append(
                DiffLine(
                    line_type="removed",
                    content=line[1:] if len(line) > 1 else "",
                    old_line_num=old_line_num,
                    new_line_num=None,
                )
            )
            if old_line_num is not None:
                old_line_num += 1
        elif line.startswith("+"):
            # Added line: exists in new file
            diff_lines.append(
                DiffLine(
                    line_type="added",
                    content=line[1:] if len(line) > 1 else "",
                    old_line_num=None,
                    new_line_num=new_line_num,
                )
            )
            if new_line_num is not None:
                new_line_num += 1
        elif line.startswith(" "):
            # Context line: unchanged, exists in both files
            diff_lines.append(
                DiffLine(
                    line_type="context",
                    content=line[1:] if len(line) > 1 else "",
                    old_line_num=old_line_num,
                    new_line_num=new_line_num,
                )
            )
            if old_line_num is not None:
                old_line_num += 1
            if new_line_num is not None:
                new_line_num += 1
        else:
            # Other lines (empty lines, etc.)
            diff_lines.append(
                DiffLine(
                    line_type="context",
                    content=line,
                    old_line_num=None,
                    new_line_num=None,
                )
            )

    return diff_lines


def compare_files(old_path: str, new_path: str) -> Optional[FileDiff]:
    """
    Compare two files and generate complete diff including parsed lines and semantic diff.

    Reads both files into memory to produce:
    1. Unified diff format (standard output from difflib)
    2. Parsed diff lines with categorized changes for UI display
    3. Semantic diff (JSON/XML aware) if applicable

    Args:
        old_path: Path to baseline/original file
        new_path: Path to changed/new file

    Returns:
        FileDiff object with both raw and parsed diffs, or None if files cannot be read
    """
    old_lines = safe_read_file(old_path)
    new_lines = safe_read_file(new_path)

    if old_lines is None or new_lines is None:
        return None

    # Generate unified diff (standard format for broad compatibility)
    unified_diff = list(
        difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=os.path.basename(old_path),
            tofile=os.path.basename(new_path),
            lineterm="",
        )
    )

    # Detect actual content changes (ignoring header lines +++/---)
    has_changes = any(
        line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
        for line in unified_diff
    )

    # Parse diff lines for structured rendering in UI
    diff_lines = parse_unified_diff(unified_diff)

    # Attempt semantic diff for supported formats (JSON, XML, YAML, etc.)
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
        semantic_diff=semantic,
    )


def compare_files_metadata(
    old_path: str, new_path: str, max_semantic_bytes: int = 200 * 1024
) -> Optional[dict]:
    """
    Lightweight, memory-efficient comparison of two files without building full diffs.
    Used for batch folder comparisons to avoid loading large files entirely.

    Optimizations:
    - Avoids building complete parsed diff line arrays
    - Uses same text-mode comparison as compare_files() to ensure consistency

    Args:
        old_path: Path to baseline file
        new_path: Path to changed file
        max_semantic_bytes: File size threshold for semantic parsing (default 200KB)

    Returns:
        Dictionary with keys: has_changes, summary, semantic_summary
        Returns None if files cannot be accessed
    """
    try:
        # Get file sizes for decision making
        s_old = os.path.getsize(old_path)
        s_new = os.path.getsize(new_path)
    except FileNotFoundError:
        return None

    old_lines = safe_read_file(old_path)
    new_lines = safe_read_file(new_path)

    if old_lines is None or new_lines is None:
        return None

    unified_diff = list(
        difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=os.path.basename(old_path),
            tofile=os.path.basename(new_path),
            lineterm="",
        )
    )

    has_changes = any(
        line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
        for line in unified_diff
    )

    summary = "No changes detected" if not has_changes else "Content differs"

    semantic_summary: Dict[str, object] = {}
    if s_old <= max_semantic_bytes and s_new <= max_semantic_bytes:
        try:
            sem = semantic_compare_files(old_path, new_path)
            if isinstance(sem, dict):
                semantic_summary = {
                    "changes_count": len(sem.get("changes", []))
                    if sem.get("changes")
                    else 0,
                    "summary": sem.get("summary", {}),
                }
            else:
                semantic_summary = {"note": "semantic parse returned unexpected format"}
        except Exception:
            semantic_summary = {"note": "semantic parse failed"}
    else:
        semantic_summary = {"note": "skipped (file too large)"}

    return {
        "has_changes": has_changes,
        "summary": summary,
        "semantic_summary": semantic_summary,
    }


def generate_diff_summary(file_diff: FileDiff) -> str:
    """
    Generate a concise human-readable summary of file changes.

    Args:
        file_diff: FileDiff object containing parsed diff data

    Returns:
        String summarizing the changes (e.g., "5 lines added; 2 removed")
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