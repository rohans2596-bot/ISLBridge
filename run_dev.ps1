# ISLBridge PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Starting ISLBridge AI Full-Stack Application" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

$pythonCmd = if (Get-Command "py" -ErrorAction SilentlyContinue) { "py -3.12" } else { "python" }

Write-Host "Starting Backend Server (FastAPI on http://localhost:8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; $pythonCmd -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "Starting Frontend Server (Vite on http://localhost:5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host "`nApplication started successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
