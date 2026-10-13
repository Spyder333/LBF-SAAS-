@echo off
setlocal enabledelayedexpansion
title LBF Solutions - Windows Standalone EXE Builder
color 0A

:: Ensure we are in the script's directory even if path has spaces
cd /d "%~dp0"

echo ===================================================================
echo   LBF SOLUTIONS - WINDOWS STANDALONE .EXE BUILDER
echo   Automated Packaging via Electron
echo ===================================================================
echo Working Directory: "%CD%"
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to build the executable!
    echo Please install Node.js (LTS recommended) from https://nodejs.org/ and retry.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo Detected Node.js: %NODE_VER%
echo.

:: 2. Check and install base dependencies
if not exist "node_modules\vite\bin\vite.js" (
    echo [Step 1/3] Installing base application dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [Step 1/3] Base dependencies verified.
)

:: 3. Check and install Electron & Electron-Builder
if not exist "node_modules\electron\" (
    echo.
    echo [Step 2/3] Installing Electron desktop packager...
    call npm install -D electron electron-builder
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Electron.
        pause
        exit /b 1
    )
) else (
    echo [Step 2/3] Electron packaging tools verified.
)

:: 4. Build frontend with Vite (with automatic Rollup recovery)
echo.
echo [Step 3/4] Compiling frontend application with Vite...
call npx vite build
if %errorlevel% neq 0 (
    echo.
    echo ===================================================================
    echo [AUTO-REPAIR] Vite build encountered a Rollup native binary issue.
    echo Attempting automatic repair for Windows (@rollup/rollup-win32-x64-msvc)...
    echo ===================================================================
    
    :: Remove corrupt binary if present
    if exist "node_modules\@rollup\rollup-win32-x64-msvc" (
        rmdir /s /q "node_modules\@rollup\rollup-win32-x64-msvc" 2>nul
    )
    
    :: Clean install the specific Windows native rollup package
    call npm install --no-audit --force @rollup/rollup-win32-x64-msvc
    
    :: Retry build
    echo Retrying Vite compilation...
    call npx vite build
    
    :: If still failing, install WebAssembly fallback
    if %errorlevel% neq 0 (
        echo Installing Rollup WebAssembly fallback...
        call npm install -D @rollup/wasm-node
        call npx vite build
    )
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Vite compilation failed!
    echo Please run 'fix_windows_build.bat' to perform a complete clean repair.
    echo.
    pause
    exit /b 1
)

:: 5. Package application using Electron Builder
echo.
echo [Step 4/4] Generating Windows .EXE installer via electron-builder...
call npx electron-builder --win

if %errorlevel% equ 0 (
    echo.
    echo ===================================================================
    echo   BUILD SUCCESSFUL!
    echo   Your standalone Windows .EXE installer is located in:
    echo   "%CD%\dist-electron"
    echo ===================================================================
    echo.
    :: Open the output folder in Windows File Explorer
    explorer "%CD%\dist-electron"
) else (
    echo.
    echo [ERROR] electron-builder encountered an issue. See log output above.
)

echo.
pause
