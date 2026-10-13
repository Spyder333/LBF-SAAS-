@echo off
title LBF Solutions - Stop Server
color 0C

echo Stopping LBF Solutions server on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>nul
    echo Terminated process PID: %%a
)
echo LBF Solutions offline server has been stopped.
timeout /t 2 /nobreak >nul
