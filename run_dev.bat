@echo off
echo ===================================================
echo   Starting ISLBridge AI Full-Stack Application
echo ===================================================

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set PYTHON_CMD=py -3.12
) else (
    set PYTHON_CMD=python
)

echo Starting Backend Server (FastAPI on http://localhost:8000)...
start "ISLBridge Backend" cmd /k "cd backend && %PYTHON_CMD% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend Server (Vite on http://localhost:5173)...
start "ISLBridge Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application is starting!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================
