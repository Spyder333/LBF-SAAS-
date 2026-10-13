@echo off
setlocal enabledelayedexpansion
title LBF Solutions - Offline Desktop Portal
color 0E

:: Ensure execution is from the script folder even with spaces in path
cd /d "%~dp0"

echo ===============================================================================
echo   LBF SOLUTIONS - HEAVY MACHINING & MOBILE LINE BORING PORTAL
echo   100%% Standalone Full-Stack Offline Desktop Application
echo ===============================================================================
echo  Working Folder: %CD%
echo.

:: 1. Verify Node.js Environment
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not detected on your system.
    echo.
    echo Running automated workshop dependency installer...
    if exist "setup_workshop_pc.bat" (
        call setup_workshop_pc.bat
        exit /b 0
    ) else (
        echo Please download and install Node.js LTS from https://nodejs.org/
        echo Then double-click this file again.
        pause
        exit /b 1
    )
)

:: 2. Verify dependencies
if not exist "node_modules\express" (
    echo [1/3] First-time setup: Installing required offline dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed. Check your internet connection for first-time install.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
    echo.
) else (
    echo [1/3] Offline application dependencies verified.
)

:: 3. Kill any lingering process on port 3000 to prevent port conflicts
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>nul
)

:: 4. Start the Full-Stack Node.js / Express Server
echo [2/3] Launching local offline engine on http://localhost:3000...
start "LBF Offline Backend Server" /min cmd /c "cd /d "%~dp0" && call npm run dev"

:: 5. Wait for the server to spin up
echo [3/3] Initializing local database and interface...
timeout /t 3 /nobreak >nul

:: 6. Launch the App as a Dedicated Desktop Window
echo.
echo Launching standalone desktop window...
start msedge --app=http://localhost:3000 2>nul || start chrome --app=http://localhost:3000 2>nul || start http://localhost:3000

echo.
echo ===============================================================================
echo   APPLICATION IS RUNNING SUCCESSFULLY!
echo   URL: http://localhost:3000
echo.
echo   - Local disk database is active (100%% offline operation)
echo   - To stop the server when done, close this window or run STOP_OFFLINE_APP.bat
echo ===============================================================================
echo.
echo Press any key to safely stop the application server...
pause >nul

:: Cleanup on exit
echo Stopping server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>nul
)
echo Application stopped.
timeout /t 2 /nobreak >nul
exit /b 0
