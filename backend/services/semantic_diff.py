"""
Semantic diffing for JSON, XML, and key-value config files.
Produces structured change objects with types:
- KEY_MISSING_OLD
- KEY_MISSING_NEW
- KEY_MODIFIED (key renamed)
- VALUE_MODIFIED
- VALUE_TYPE_CHANGED

This module exposes a single function `semantic_compare_files(old_path, new_path)`
that returns a dict with `changes` (list of change objects) and `summary`.
"""
from typing import Dict, Any, List, Tuple, Optional
import json
import xml.etree.ElementTree as ET
import os
from pathlib import Path
from collections import defaultdict

# YAML support
try:
    import yaml  # PyYAML
except Exception:
    yaml = None


Change = Dict[str, Any]


def parse_json_file(path: str) -> Optional[Dict[str, Any]]:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return json.load(f)
    except Exception:
        return None


def parse_key_value_file(path: str) -> Optional[Dict[str, str]]:
    data = {}
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#") or line.startswith("//"):
                    continue
                # support key=value or key: value
                if "=" in line:
                    k, v = line.split("=", 1)
                elif ":" in line:
                    k, v = line.split(":", 1)
                else:
                    # try whitespace-separated key value
                    parts = line.split(None, 1)
                    if len(parts) == 2:
                        k, v = parts
                    else:
                        continue
                data[k.strip()] = v.strip()
        return data
    except Exception:
        return None


def parse_yaml_file(path: str) -> Optional[Dict[str, Any]]:
    if yaml is None:
        return None
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            obj = yaml.safe_load(f)
            # flatten nested structures into dot paths
            def flatten(prefix, val, acc):
                if isinstance(val, dict):
                    for kk, vv in val.items():
                        flatten(f"{prefix}.{kk}" if prefix else kk, vv, acc)
                elif isinstance(val, list):
                    for i, item in enumerate(val):
                        flatten(f"{prefix}[{i}]", item, acc)
                else:
                    acc[prefix] = val
            results: Dict[str, Any] = {}
            flatten("", obj, results)
            return results
    except Exception:
        return None


def flatten_xml(elem: ET.Element, prefix: str = "") -> Dict[str, str]:
    """Flatten XML into path->value mapping.
    Attributes are represented as 'path@attr'. Text content of elements is stored as 'path'."""
    results: Dict[str, str] = {}
    path = f"{prefix}/{elem.tag}" if prefix else f"{elem.tag}"

    # Element text
    text = (elem.text or "").strip()
    if text:
        results[path] = text

    # Attributes
    for attr_name, attr_val in elem.attrib.items():
        results[f"{path}@{attr_name}"] = attr_val

    # Recurse
    for child in elem:
        results.update(flatten_xml(child, path))

    return results


def parse_xml_file(path: str) -> Optional[Dict[str, str]]:
    try:
        tree = ET.parse(path)
        root = tree.getroot()
        return flatten_xml(root)
    except Exception:
        return None


def detect_file_type(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext == ".json":
        return "json"
    if ext in (".yml", ".yaml"):
        return "yaml"
    if ext in (".xml", ".config"):
        # try xml parse first
        try:
            _ = parse_xml_file(path)
            return "xml"
        except Exception:
            # fall back next
            pass
    if ext in (".env", ".cfg", ".txt"):
        return "keyvalue"
    # fallback to keyvalue
    return "keyvalue"


def value_type(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "bool"
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return "number"
    if isinstance(v, str):
        # try to detect boolean and numbers
        sv = v.strip().lower()
        if sv in ("true", "false"):
            return "bool"
        try:
            int(sv)
            return "number"
        except Exception:
            try:
                float(sv)
                return "number"
            except Exception:
                return "string"
    return type(v).__name__


def compare_maps(old_map: Dict[str, Any], new_map: Dict[str, Any]) -> Tuple[List[Change], Dict[str, Any]]:
    changes: List[Change] = []

    old_keys = set(old_map.keys())
    new_keys = set(new_map.keys())

    # Direct missing keys
    for k in sorted(old_keys - new_keys):
        changes.append({
            "type": "KEY_MISSING_NEW",
            "key": k,
            "old_value": old_map.get(k),
            "new_value": None
        })

    for k in sorted(new_keys - old_keys):
        changes.append({
            "type": "KEY_MISSING_OLD",
            "key": k,
            "old_value": None,
            "new_value": new_map.get(k)
        })

    # Same keys
    for k in sorted(old_keys & new_keys):
        ov = old_map.get(k)
        nv = new_map.get(k)
        if ov != nv:
            # type change?
            t_old = value_type(ov)
            t_new = value_type(nv)
            if t_old != t_new:
                changes.append({
                    "type": "VALUE_TYPE_CHANGED",
                    "key": k,
                    "old_value": ov,
                    "new_value": nv,
                    "old_type": t_old,
                    "new_type": t_new
                })
            else:
                changes.append({
                    "type": "VALUE_MODIFIED",
                    "key": k,
                    "old_value": ov,
                    "new_value": nv
                })

    # Heuristic: detect possible renames by matching values
    # Map value->keys for small sets to find candidate renames
    potential_renames = []
    if len(old_map) <= 2000 and len(new_map) <= 2000:
        val_to_old_keys = defaultdict(list)
        for k, v in old_map.items():
            val_to_old_keys[str(v)].append(k)
        for nk in sorted(new_keys - old_keys):
            nv = new_map.get(nk)
            candidates = val_to_old_keys.get(str(nv), [])
            if candidates:
                # pick first candidate not already reported
                ok = candidates[0]
                # remove the previously reported KEY_MISSING_NEW/OLD entries for ok and nk
                potential_renames.append((ok, nk))

    # Convert renames into KEY_MODIFIED entries and remove related missing entries
    if potential_renames:
        # Remove entries for matched keys
        new_changes = []
        skip_pairs = set(potential_renames)
        for ch in changes:
            if ch["type"] in ("KEY_MISSING_NEW", "KEY_MISSING_OLD"):
                # check if this key is part of a rename
                key = ch.get("key")
                matched = False
                for ok, nk in potential_renames:
                    if key == ok or key == nk:
                        matched = True
                        break
                if matched:
                    continue
            new_changes.append(ch)
        changes = new_changes

        for ok, nk in potential_renames:
            changes.append({
                "type": "KEY_MODIFIED",
                "old_key": ok,
                "new_key": nk,
                "old_value": old_map.get(ok),
                "new_value": new_map.get(nk)
            })

    summary = {
        "total_old_keys": len(old_map),
        "total_new_keys": len(new_map),
        "changes_count": len(changes),
    }

    return changes, summary


def semantic_compare_files(old_path: str, new_path: str) -> Dict[str, Any]:
    """Compare two files on disk by path."""
    old_type = detect_file_type(old_path)
    new_type = detect_file_type(new_path)

    # Default results
    result = {
        "file_name": os.path.basename(old_path),
        "old_type": old_type,
        "new_type": new_type,
        "changes": [],
        "summary": {}
    }

    # Parse according to type
    old_map = None
    new_map = None

    if old_type == "json":
        old_map = parse_json_file(old_path) or {}
    elif old_type == "xml":
        old_map = parse_xml_file(old_path) or {}
    elif old_type == "yaml":
        old_map = parse_yaml_file(old_path) or {}
    else:
        old_map = parse_key_value_file(old_path) or {}

    if new_type == "json":
        new_map = parse_json_file(new_path) or {}
    elif new_type == "xml":
        new_map = parse_xml_file(new_path) or {}
    elif new_type == "yaml":
        new_map = parse_yaml_file(new_path) or {}
    else:
        new_map = parse_key_value_file(new_path) or {}

    # If both maps are dictionaries, compare semantically
    if isinstance(old_map, dict) and isinstance(new_map, dict):
        changes, summary = compare_maps(old_map, new_map)
        result["changes"] = changes
        result["summary"] = summary
    else:
        # If parsing failed, return empty
        result["changes"] = []
        result["summary"] = {
            "note": "Could not parse files for semantic diff"
        }

    return result


def semantic_compare_texts(old_text: str, new_text: str, old_name: str = "old", new_name: str = "new") -> Dict[str, Any]:
    """Compare two file contents provided as text. Detect type by filename hints."""
    # choose type based on filename extension hints
    old_type = detect_file_type(old_name)
    new_type = detect_file_type(new_name)

    def parse_text(text: str, type_hint: str) -> Optional[Dict[str, Any]]:
        if type_hint == "json":
            try:
                return json.loads(text)
            except Exception:
                return None
        if type_hint == "yaml":
            if yaml is None:
                return None
            try:
                obj = yaml.safe_load(text)
                results: Dict[str, Any] = {}
                def flatten(prefix, val, acc):
                    if isinstance(val, dict):
                        for kk, vv in val.items():
                            flatten(f"{prefix}.{kk}" if prefix else kk, vv, acc)
                    elif isinstance(val, list):
                        for i, item in enumerate(val):
                            flatten(f"{prefix}[{i}]", item, acc)
                    else:
                        acc[prefix] = val
                flatten("", obj, results)
                return results
            except Exception:
                return None
        if type_hint == "xml":
            try:
                root = ET.fromstring(text)
                return flatten_xml(root)
            except Exception:
                return None
        # keyvalue fallback
        try:
            d = {}
            for raw in text.splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or line.startswith("//"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                elif ":" in line:
                    k, v = line.split(":", 1)
                else:
                    parts = line.split(None, 1)
                    if len(parts) == 2:
                        k, v = parts
                    else:
                        continue
                d[k.strip()] = v.strip()
            return d
        except Exception:
            return None

    old_map = parse_text(old_text, old_type) or {}
    new_map = parse_text(new_text, new_type) or {}

    if isinstance(old_map, dict) and isinstance(new_map, dict):
        changes, summary = compare_maps(old_map, new_map)
        return {"changes": changes, "summary": summary, "old_type": old_type, "new_type": new_type}
    else:
        return {"changes": [], "summary": {"note": "Could not parse texts for semantic diff"}, "old_type": old_type, "new_type": new_type}

