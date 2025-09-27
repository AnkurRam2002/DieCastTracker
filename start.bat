@echo off
echo 🚗 DieCast Tracker - Quick Start
echo ================================
echo.
echo 1. Web Application (Default)
echo 2. CLI Interface
echo 3. Add New Model
echo 4. View Statistics
echo 5. Search Models
echo 6. Open Excel File
echo.
set /p choice="Enter your choice (1-6, or press Enter for Web): "

if "%choice%"=="" set choice=1
if "%choice%"=="1" (
    echo Starting Web Application...
    python start_web.py
) else if "%choice%"=="2" (
    echo Starting CLI Interface...
    python main.py
) else if "%choice%"=="3" (
    echo Starting Add Model Script...
    python scripts/add_model.py
) else if "%choice%"=="4" (
    echo Starting Statistics Script...
    python scripts/statistics.py
) else if "%choice%"=="5" (
    echo Starting Search Script...
    python scripts/search_model.py
) else if "%choice%"=="6" (
    echo Opening Excel File...
    start data\HW_list.xlsx
) else (
    echo Invalid choice. Starting Web Application...
    python start_web.py
)

pause