import os

def scan_configs(root):
    components = {}
    for comp in os.listdir(root):
        path = os.path.join(root, comp)
        if os.path.isdir(path):
            files = []
            for r, _, f_list in os.walk(path):
                for f in f_list:
                    files.append(os.path.join(r, f))
            components[comp] = files
    return components
