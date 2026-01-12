from pathlib import Path
from fastapi.testclient import TestClient
import json

# Prepare sample folders
root = Path(__file__).resolve().parents[1]
old = root / 'tmp_smoke_old'
new = root / 'tmp_smoke_new'
old.mkdir(exist_ok=True)
new.mkdir(exist_ok=True)
(old / 'config.json').write_text('{"a":1, "b":2}\n')
(new / 'config.json').write_text('{"a":1, "b":3, "c":4}\n')

# Import app from backend
import sys
sys.path.append(str(root))
from backend.main import app

client = TestClient(app)

# Test scan-folders
res = client.post('/scan-folders', json={'old_folder': str(old), 'new_folder': str(new)})
print('scan-folders status:', res.status_code)
print(res.json())

# Test compare-folders
res2 = client.post('/compare-folders', json={'old_folder': str(old), 'new_folder': str(new)})
print('compare-folders status:', res2.status_code)
print(json.dumps(res2.json(), indent=2))

# Test compare for a single file (by path)
res3 = client.post('/compare', json={'old_path': str(old / 'config.json'), 'new_path': str(new / 'config.json')})
print('compare status:', res3.status_code)
print(json.dumps(res3.json(), indent=2))
