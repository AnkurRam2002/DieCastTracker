@echo off
echo 🐍 Activating Python Virtual Environment...
echo.

REM Check if venv directory exists
if not exist "venv" (
    echo ❌ Virtual environment not found!
    echo.
    echo Please run one of these commands first:
    echo   python -m venv venv
    echo   npm run venv
    echo.
    pause
    exit /b 1
)

REM Activate the virtual environment
call venv\Scripts\activate.bat

REM Check if activation was successful
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment!
    echo.
    echo Please check if Python is installed and accessible.
    pause
    exit /b 1
)

echo ✅ Virtual environment activated successfully!
echo.
echo 💡 You can now run Python commands with the virtual environment.
echo.
echo Common commands:
echo   python main.py          # Start CLI interface
echo   python start_web.py     # Start web application
echo   pip install package     # Install new packages
echo   pip list                # List installed packages
echo.
echo To deactivate, type: deactivate
echo.

REM Keep the command prompt open
cmd /k
