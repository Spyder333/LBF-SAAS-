@echo off
setlocal enabledelayedexpansion
title LBF Solutions - Offline Background Server
color 0A

cd /d "%~dp0"

echo ===================================================================
echo   LBF SOLUTIONS - STARTING BACKGROUND OFFLINE SERVER
echo ===================================================================

:: Ensure dependencies are present
if not exist "node_modules\express" (
    echo Installing dependencies...
    call npm install
)

:: Clear port 3000 if occupied
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo Starting server on http://localhost:3000...
start "LBF Offline Server" cmd /c "cd /d "%~dp0" && call npm run dev"

echo Server started! Access at http://localhost:3000 or on your LAN via http://<YOUR-IP>:3000
timeout /t 3 /nobreak >nul
