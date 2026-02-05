import os
from typing import Dict, List

from utils.file_utils import (
    safe_listdir,
    safe_isdir,
    normalize_path,
    path_exists,
)


def scan_delta_groups(database_root: str) -> Dict:
    """
    Scan a database folder with structure:

        <database_root>/
            BaseDrop/      (ignored)
            DeltaDrop/
                TableScripts/
                StoredProcedures/
                Functions/
                Index/
                ...

    Returns:
        {
          "database_name": <str>,
          "groups": [
            {
              "name": "TableScripts",
              "files": [
                {
                  "file_name": "tbl1_delta.sql",
                  "relative_path": "TableScripts/tbl1_delta.sql",
                  "full_path": "C:/.../DeltaDrop/TableScripts/tbl1_delta.sql"
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

    # DeltaDrop under the database root
    delta_drop_dir = os.path.join(database_root, "DeltaDrop")
    if not path_exists(delta_drop_dir) or not safe_isdir(delta_drop_dir):
        # no DeltaDrop -> nothing to do
        return result

    delta_drop_dir = normalize_path(delta_drop_dir)

    groups: List[Dict] = []

    # Each immediate subfolder under DeltaDrop is a delta group
    for group_name in safe_listdir(delta_drop_dir):
        group_path = os.path.join(delta_drop_dir, group_name)
        if not safe_isdir(group_path):
            continue

        files: List[Dict] = []
        for dirpath, dirnames, filenames in os.walk(group_path):
            for fname in filenames:
                if not fname.lower().endswith(".sql"):
                    continue
                full_path = normalize_path(os.path.join(dirpath, fname))
                rel_path = os.path.relpath(full_path, delta_drop_dir)
                files.append(
                    {
                        "file_name": fname,
                        "relative_path": rel_path.replace("\\", "/"),
                        "full_path": full_path,
                    }
                )

        if files:
            groups.append(
                {
                    "name": group_name,
                    "files": files,
                }
            )

    result["groups"] = groups
    return result