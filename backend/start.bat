@echo off
echo Starting Config Compare Tool Backend...
echo.
echo Make sure you have activated your virtual environment!
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
