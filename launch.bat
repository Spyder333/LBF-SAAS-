@echo off
setlocal enabledelayedexpansion
title LBF Solutions - Mobile Line Boring & Workshop Portal
color 0E

:: Ensure we are in the script's directory even if path has spaces
cd /d "%~dp0"

echo ===================================================================
echo   LBF SOLUTIONS - MOBILE LINE BORING & MACHINING PORTAL
echo   Workshop Invoicing, Fleet & Engineering Formulas System
echo ===================================================================
echo Current Directory: "%CD%"
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo.
    echo Please install Node.js from https://nodejs.org/ (LTS version recommended).
    echo After installing, restart your computer or command prompt, then run this file again.
    echo.
    pause
    exit /b 1
)

:: 2. Verify npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm was not found! Please check your Node.js installation.
    pause
    exit /b 1
)

:: 3. Check if node_modules and Vite exist
if not exist "node_modules\vite\bin\vite.js" (
    echo [1/3] Dependencies missing or incomplete. Running npm install...
    echo (This may take 1-2 minutes depending on your internet connection...)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] npm install encountered an error.
        echo Please ensure you have an active internet connection and try running:
        echo   npm install --legacy-peer-deps
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
    echo.
) else (
    echo [1/3] Dependencies verified.
)

:: 4. Start Vite development server
echo [2/3] Starting LBF Solutions local server on port 3000...
start "LBF Solutions Server" cmd /c "cd /d "%~dp0" && call npm run dev"

:: 5. Wait for the server to spin up
echo [3/3] Waiting for server initialization...
timeout /t 4 /nobreak >nul

:: 6. Open standalone application window
echo Opening LBF Solutions application...
start msedge --app=http://localhost:3000 2>nul || start chrome --app=http://localhost:3000 2>nul || start http://localhost:3000

echo.
echo ===================================================================
echo   LBF Solutions is running at: http://localhost:3000
echo.
echo   Keep this window open while using the application.
echo   To close the server, press any key or close this window.
echo ===================================================================
echo.
pause
