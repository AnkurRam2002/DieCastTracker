@echo off
REM DieCast Tracker - Desktop Launcher
REM This batch file can be placed on your desktop

title DieCast Tracker - Desktop Launcher

echo 🚗 DieCast Tracker - Quick Start
echo ================================
echo.

REM Change to the project directory
cd /d "C:\Users\Ankur Ram\OneDrive\Desktop\Workspace\Python\DieCastTracker"

REM Check if the project directory exists
if not exist "start.bat" (
    echo ❌ DieCast Tracker project not found!
    echo Please check the path: C:\Users\Ankur Ram\OneDrive\Desktop\Workspace\Python\DieCastTracker
    echo.
    pause
    exit /b 1
)

REM Run the original start.bat
call start.bat

REM Always keep window open
echo.
echo ================================
echo DieCast Tracker session ended.
echo ================================
echo.
echo Press any key to close this window...
pause >nul
