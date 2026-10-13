@echo off
setlocal enabledelayedexpansion
title LBF Solutions - Windows Build & Rollup Repair Utility
color 0E

cd /d "%~dp0"

echo ===================================================================
echo   LBF SOLUTIONS - WINDOWS BUILD & ROLLUP REPAIR UTILITY
echo   Resolves: @rollup/rollup-win32-x64-msvc / ERR_DLOPEN_FAILED
echo ===================================================================
echo Directory: "%CD%"
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ (LTS recommended).
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo Detected Node.js: %NODE_VER%
echo.

:: 2. Clean corrupted Rollup binaries
echo [1/4] Removing potentially corrupted native Rollup modules...
if exist "node_modules\@rollup\rollup-win32-x64-msvc" (
    rmdir /s /q "node_modules\@rollup\rollup-win32-x64-msvc" 2>nul
)
if exist "node_modules\@rollup\rollup-win32-ia32-msvc" (
    rmdir /s /q "node_modules\@rollup\rollup-win32-ia32-msvc" 2>nul
)
if exist "node_modules\@rollup\rollup-win32-arm64-msvc" (
    rmdir /s /q "node_modules\@rollup\rollup-win32-arm64-msvc" 2>nul
)

:: 3. Clear npm cache lock if needed and reinstall native Windows Rollup binary
echo [2/4] Installing correct Windows 64-bit native Rollup binary...
call npm install --no-audit --force @rollup/rollup-win32-x64-msvc
if %errorlevel% neq 0 (
    echo [WARNING] Direct install had warnings, trying optional dependencies...
    call npm install --include=optional
)

:: 4. Verify base build with Vite
echo.
echo [3/4] Testing Vite compilation...
call npx vite build
if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] If native binary still fails under Node %NODE_VER%, installing WebAssembly fallback...
    call npm install -D @rollup/wasm-node
    call npx vite build
)

if %errorlevel% neq 0 (
    echo.
    echo ===================================================================
    echo [REPAIR STEP 2] Performing full clean install...
    echo ===================================================================
    echo Deleting node_modules and package-lock.json...
    if exist "package-lock.json" del /f /q "package-lock.json"
    if exist "node_modules" rmdir /s /q "node_modules"
    echo Reinstalling fresh dependencies...
    call npm install
    call npm install --save-optional @rollup/rollup-win32-x64-msvc
    call npx vite build
)

if %errorlevel% equ 0 (
    echo.
    echo ===================================================================
    echo   REPAIR SUCCESSFUL! VITE BUILD COMPLETED!
    echo   You can now run:
    echo     1. build_exe.bat  (to build the Windows .EXE installer)
    echo     2. launch.bat     (to run the local workshop server)
    echo ===================================================================
    echo.
    set /p BUILD_NOW="Would you like to build the Windows .EXE installer now? (Y/N): "
    if /i "!BUILD_NOW!"=="Y" (
        call build_exe.bat
    )
) else (
    echo.
    echo [ERROR] Vite build could not complete. Check error messages above.
)

echo.
pause
