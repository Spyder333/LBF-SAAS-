@echo off
setlocal enabledelayedexpansion
title LBF Solutions - Master Workshop PC & Desktop Installer
color 0A

:: Ensure working directory is the script's directory even with spaces
cd /d "%~dp0"

echo ==============================================================================
echo    LBF SOLUTIONS &bull; HEAVY MACHINING ^& LINE BORING SAAS PORTAL
echo    Automated Workshop Desktop Installer, Dependencies ^& Standalone .EXE
echo    Harare HQ: Carlton Road, Harare &bull; Tel: 077 900 4626 / +263 77 900 4626
echo ==============================================================================
echo Working Directory: "%CD%"
echo.

:: -----------------------------------------------------------------------------
:: STEP 1: Verify or Automatically Install Node.js & NPM
:: -----------------------------------------------------------------------------
echo [Step 1/5] Checking Node.js and NPM runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTICE] Node.js is not found on this computer.
    echo Attempting automated installation via Windows Package Manager (winget)...
    echo.
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        echo Running: winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    ) else (
        echo [NOTICE] winget not available. Downloading official Node.js installer via PowerShell...
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $installer = Join-Path $env:TEMP 'nodejs_installer.msi'; Write-Host 'Downloading Node.js LTS...'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile $installer; Write-Host 'Installing Node.js silently (please wait 60s)...'; Start-Process msiexec.exe -ArgumentList '/i', $installer, '/qn', '/norestart' -Wait; Remove-Item $installer -ErrorAction SilentlyContinue"
    )

    :: Refresh PATH environment variable in current session
    for /f "tokens=2*" %%a in ('reg query "HKLM\System\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
    for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USR_PATH=%%b"
    set "PATH=%SYS_PATH%;%USR_PATH%;%PATH%"

    where node >nul 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo [WARNING] Node.js was installed, but command prompt needs a quick restart.
        echo Please close this window and double-click setup_workshop_pc.bat again.
        echo Alternatively, download Node.js directly from: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
echo [OK] Node.js %NODE_VER% and npm %NPM_VER% detected and ready.
echo.

:: -----------------------------------------------------------------------------
:: STEP 2: Install All Application Dependencies & Windows Native Binaries
:: -----------------------------------------------------------------------------
echo [Step 2/5] Checking and installing application dependencies...
if not exist "node_modules\" (
    echo Installing npm packages (this takes ~30-60 seconds on first run)...
    call npm install --no-audit
) else (
    echo Base dependencies verified.
)

:: Ensure Windows native Rollup package is installed cleanly
echo Verifying Windows Rollup native bindings...
if not exist "node_modules\@rollup\rollup-win32-x64-msvc\" (
    call npm install --save-optional --no-audit @rollup/rollup-win32-x64-msvc
)
echo [OK] Dependencies ready.
echo.

:: -----------------------------------------------------------------------------
:: STEP 3: Pre-Compile High-Speed Frontend Assets (Vite)
:: -----------------------------------------------------------------------------
echo [Step 3/5] Pre-compiling high-speed application assets with Vite...
call npx vite build
if %errorlevel% neq 0 (
    echo [RECOVERY] Attempting fallback with WebAssembly Rollup...
    call npm install -D @rollup/wasm-node
    call npx vite build
)
if %errorlevel% equ 0 (
    echo [OK] Frontend compilation complete in dist/
) else (
    echo [ERROR] Frontend compilation encountered an issue.
)
echo.

:: -----------------------------------------------------------------------------
:: STEP 4: Build Standalone Windows .EXE Setup Installer
:: -----------------------------------------------------------------------------
echo [Step 4/5] Checking Electron and building standalone Windows .EXE...
if not exist "node_modules\electron\" (
    echo Installing Electron build tools...
    call npm install -D electron electron-builder
)

echo Generating Windows executable package...
call npx electron-builder --win

if exist "dist-electron\" (
    echo [OK] Standalone Windows installer generated in:
    echo      "%CD%\dist-electron"
)
echo.

:: -----------------------------------------------------------------------------
:: STEP 5: Create 1-Click Desktop Shortcut
:: -----------------------------------------------------------------------------
echo [Step 5/5] Creating 1-Click Windows Desktop Shortcut...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $desktop 'LBF Solutions Machining Portal.lnk')); $s.TargetPath = (Join-Path '%CD%' 'launch.bat'); $s.WorkingDirectory = '%CD%'; $s.Description = 'LBF Solutions - Heavy Mobile Line Boring & Workshop Portal'; $s.Save()"
echo [OK] Desktop Shortcut 'LBF Solutions Machining Portal' created on your Desktop!
echo.

:: -----------------------------------------------------------------------------
:: FINISHED! Launch Application Option
:: -----------------------------------------------------------------------------
echo ==============================================================================
echo    INSTALLATION ^& SETUP COMPLETE!
echo.
echo    1. Standalone .EXE installer:  "%CD%\dist-electron"
echo    2. 1-Click Desktop Shortcut:  "LBF Solutions Machining Portal" on your Desktop
echo    3. Local Server Runner:       "%CD%\launch.bat"
echo ==============================================================================
echo.
set /p LAUNCH_CHOICE="Would you like to launch LBF Solutions now? (Y/N, default Y): "
if /i "!LAUNCH_CHOICE!"=="" set LAUNCH_CHOICE=Y
if /i "!LAUNCH_CHOICE!"=="Y" (
    echo Starting LBF Solutions...
    start "" launch.bat
)

echo.
pause
