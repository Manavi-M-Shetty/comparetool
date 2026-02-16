import os
import sys
import time
import threading
import webbrowser
import socket

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, PlainTextResponse

# Import your existing FastAPI API (backend/main.py -> app)
from backend.main import app as api_app


# ---------- Helpers to find files both in source and in PyInstaller exe ----------

def resource_path(*parts: str) -> str:
    """
    Return an absolute path to a resource, working both:
    - when running from source
    - when running from a PyInstaller one-file EXE
    """
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        base_dir = sys._MEIPASS  # type: ignore[attr-defined]
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, *parts)


FRONTEND_DIST = resource_path("frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

# ---------- Root app (what uvicorn will actually run) ----------

app = FastAPI(title="Config Compare Tool")

# Mount your existing API at /api
# e.g. /api/compare, /api/scan-folders, etc.
app.mount("/api", api_app)


# Serve static frontend files
if os.path.isdir(ASSETS_DIR):
    # Static assets used by built index.html (e.g. /assets/...)
    app.mount(
        "/assets",
        StaticFiles(directory=ASSETS_DIR, html=False),
        name="assets",
    )

    @app.get("/", include_in_schema=False)
    async def serve_index():
        """Serve the React app main HTML."""
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """
        SPA fallback: for any unknown route, return index.html so
        react-router can handle client-side navigation.
        """
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return PlainTextResponse(
            "frontend/dist not found. Make sure you ran `npm run build`.",
            status_code=500,
        )
else:
    @app.get("/", include_in_schema=False)
    async def no_frontend():
        return PlainTextResponse(
            f"Missing frontend build at: {FRONTEND_DIST}\n"
            "Run `npm run build` inside the frontend folder.",
            status_code=500,
        )


# ---------- Auto-open browser when server is ready ----------

def open_browser_when_ready(url: str, timeout: float = 20.0) -> None:
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection(("127.0.0.1", 8000), timeout=1):
                webbrowser.open(url)
                return
        except OSError:
            time.sleep(0.5)


if __name__ == "__main__":
    target_url = "http://127.0.0.1:8000"
    threading.Thread(
        target=open_browser_when_ready, args=(target_url,), daemon=True
    ).start()

    uvicorn.run(app, host="127.0.0.1", port=8000)