@echo off
REM DieCastTracker - Windows Batch Script Runner
REM Hot Wheels Collection Management System

title DieCastTracker - Hot Wheels Collection Manager

echo.
echo 🚗==================================================🚗
echo     HOT WHEELS DIE-CAST TRACKER
echo     Collection Management System
echo 🚗==================================================🚗
echo.

:menu
echo 📋 QUICK COMMANDS
echo --------------------------------
echo 1. 🆕 Add New Model
echo 2. 🔍 Search Models  
echo 3. 📊 View Statistics
echo 4. ➕ Add New Field
echo 5. 📁 Open Excel File
echo 6. 🚀 Launch Main Menu
echo 7. ❓ Help
echo 8. 🚪 Exit
echo --------------------------------

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Running Add Model...
    python scripts\add_model.py
    goto end
)
if "%choice%"=="2" (
    echo.
    echo 🚀 Running Search...
    python scripts\search_model.py
    goto end
)
if "%choice%"=="3" (
    echo.
    echo 🚀 Running Statistics...
    python scripts\statistics.py
    goto end
)
if "%choice%"=="4" (
    echo.
    echo 🚀 Running Add Field...
    python scripts\add_field.py
    goto end
)
if "%choice%"=="5" (
    echo.
    echo 📁 Opening Excel file...
    if exist "data\HW_list.xlsx" (
        start "" "data\HW_list.xlsx"
        echo ✅ Excel file opened!
    ) else (
        echo ❌ Excel file not found!
    )
    goto end
)
if "%choice%"=="6" (
    echo.
    echo 🚀 Launching Main Menu...
    python main.py
    goto end
)
if "%choice%"=="7" (
    echo.
    echo 📖 HELP & INFORMATION
    echo ==================================================
    echo 🚗 DieCastTracker - Hot Wheels Collection Manager
    echo.
    echo 📁 Available Commands:
    echo   • add_model.py    - Add new cars to collection
    echo   • search_model.py - Search for existing cars
    echo   • statistics.py   - View collection statistics
    echo   • add_field.py    - Add new fields to database
    echo   • main.py         - Interactive main menu
    echo.
    echo 💡 Usage Tips:
    echo   • Use shortcuts like 'Car Name#13' when adding models
    echo   • Statistics show collection progress and insights
    echo   • Excel file is auto-created if it doesn't exist
    echo ==================================================
    goto end
)
if "%choice%"=="8" (
    echo.
    echo 👋 Thank you for using DieCastTracker!
    echo 🚗 Happy collecting!
    exit /b 0
)

echo ❌ Invalid choice! Please enter a number between 1-8.
echo.
goto menu

:end
echo.
pause
goto menu
