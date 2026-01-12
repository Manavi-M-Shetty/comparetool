@echo off
echo Starting backend and frontend (Windows)

REM Start backend in new window (assumes dependencies installed and uvicorn available)
start cmd /k "cd %~dp0\backend && echo Starting backend on port 8000... && python -m uvicorn main:app --reload --port 8000"

REM Start frontend using the script that ensures port 3000
start cmd /k "cd %~dp0\frontend && .\start.bat"

echo All start commands issued. Frontend should open http://localhost:3000 when available.
pause