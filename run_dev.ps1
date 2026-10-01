# ISLBridge PowerShell Launcher
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Starting ISLBridge AI Full-Stack Application" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

$backendCmd = "Set-Location -LiteralPath '$backendPath'; py -3.12 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
$frontendCmd = "Set-Location -LiteralPath '$frontendPath'; npm run dev"

Write-Host "Starting Backend Server (FastAPI on http://localhost:8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCmd

Write-Host "Starting Frontend Server (Vite on http://localhost:5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCmd

Write-Host "`nApplication started successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
