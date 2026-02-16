"""
Service for scanning database delta migration folders.
Extracts delta groups (migration script collections) from DeltaDrop folder structures.
Primarily used for SQL Server or similar database migration scenarios.
"""
import os
from typing import Dict, List

from ..utils.file_utils import (
    safe_listdir,
    safe_isdir,
    normalize_path,
    path_exists,
)


def scan_delta_groups(database_root: str) -> Dict:
    """
    Scan a database folder structure and extract delta migration groups.
    
    Expected folder structure:
        <database_root>/
            BaseDrop/              (ignored - baseline scripts)
            DeltaDrop/             (processed - delta/migration scripts)
                TableScripts/      (delta group folder)
                    table_1.sql
                    table_2.sql
                StoredProcedures/  (delta group folder)
                    proc_1.sql
                Functions/         (delta group folder)
                    func_1.sql
                ...
    
    Args:
        database_root: Path to the database root folder
                      (contains BaseDrop and DeltaDrop subdirectories)
        
    Returns:
        Dictionary with structure:
        {
            "database_name": "DatabaseName",
            "groups": [
                {
                    "name": "TableScripts",
                    "files": [
                        {
                            "file_name": "table_1.sql",
                            "relative_path": "TableScripts/table_1.sql",
                            "full_path": "/path/to/DeltaDrop/TableScripts/table_1.sql"
                        },
                        ...
                    ]
                },
                ...
            ]
        }
    """
    result = {
        "database_name": "",
        "groups": [],
    }

    if not path_exists(database_root) or not safe_isdir(database_root):
        return result

    database_root = normalize_path(database_root)
    db_name = os.path.basename(database_root.rstrip(os.sep))
    result["database_name"] = db_name

    # DeltaDrop folder contains the migration scripts (BaseDrop is ignored as baseline)
    delta_drop_dir = os.path.join(database_root, "DeltaDrop")
    if not path_exists(delta_drop_dir) or not safe_isdir(delta_drop_dir):
        # No DeltaDrop folder means no migration scripts to process
        return result

    delta_drop_dir = normalize_path(delta_drop_dir)

    groups: List[Dict] = []

    # Each immediate subfolder under DeltaDrop represents a delta group
    # (e.g., TableScripts, StoredProcedures, Functions, etc.)
    for group_name in safe_listdir(delta_drop_dir):
        group_path = os.path.join(delta_drop_dir, group_name)
        if not safe_isdir(group_path):
            continue

        files: List[Dict] = []
        # Recursively collect all SQL files within the group folder
        for dirpath, dirnames, filenames in os.walk(group_path):
            for fname in filenames:
                if not fname.lower().endswith(".sql"):
                    continue
                full_path = normalize_path(os.path.join(dirpath, fname))
                # Compute relative path from DeltaDrop root
                rel_path = os.path.relpath(full_path, delta_drop_dir)
                files.append(
                    {
                        "file_name": fname,
                        "relative_path": rel_path.replace("\\", "/"),
                        "full_path": full_path,
                    }
                )

        # Only include groups that have SQL files
        if files:
            groups.append(
                {
                    "name": group_name,
                    "files": files,
                }
            )

    result["groups"] = groups
    return result