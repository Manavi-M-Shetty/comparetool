@echo off
REM Robust start script: try to free port 3000 up to 5 times, then start dev server with strict port
echo Starting frontend (attempt will ensure PORT 3000 is free)...
setlocal enabledelayedexpansion
set RETRIES=0
:CHECKPORT
set PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
  set PID=%%a
)
if defined PID (
  echo [!] Port 3000 in use by PID !PID!. Attempting to terminate.
  taskkill /PID !PID! /F >nul 2>&1
  if errorlevel 1 (
    echo Failed to kill PID !PID!. You may need to close it manually.
  ) else (
    echo Killed PID !PID!.
  )
  set /a RETRIES+=1
  if !RETRIES! gtr 5 (
    echo "Port 3000 still busy after !RETRIES! attempts. Falling back to port 3001."
    echo "Starting dev server on port 3001 instead."
    set PORT=3001 && npm run dev -- --strictPort
    if errorlevel 1 (
      echo Dev server failed to start on port 3001. Check the terminal for errors.
      pause
      goto END
    ) else (
      echo Dev server started on port 3001.
      start http://localhost:3001
      goto END
    )
  )
  timeout /t 1 /nobreak >nul
  goto CHECKPORT
)
echo Port 3000 is free. Starting dev server with strict port...
set PORT=3000 && npm run dev -- --strictPort
if errorlevel 1 (
  echo Dev server failed to start on port 3000. Check for errors in the terminal.
  pause
) else (
  echo Dev server started on port 3000.
  start http://localhost:3000
)
:END
endlocal
pause
