from file_reader import scan_configs
import difflib

def compare_folders(old_root, new_root):
    old_components = scan_configs(old_root)
    new_components = scan_configs(new_root)

    summary = []
    detailed = {}

    for comp in old_components:
        if comp not in new_components:
            summary.append(f"{comp}: Missing in NEW folder")
            continue

        detailed[comp] = []

        for old_file in old_components[comp]:
            file_name = old_file.split("\\")[-1]
            match = None

            for new_file in new_components[comp]:
                if new_file.split("\\")[-1] == file_name:
                    match = new_file
                    break

            if not match:
                detailed[comp].append(f"{file_name}: Missing in NEW configs")
            else:
                with open(old_file, "r", errors="ignore") as f:
                    old_lines = f.readlines()
                with open(match, "r", errors="ignore") as f:
                    new_lines = f.readlines()

                diff = list(difflib.unified_diff(old_lines, new_lines, lineterm=""))
                detailed[comp].append({ "file": file_name, "diff": diff })

    return {"summary": summary, "detailed": detailed}
