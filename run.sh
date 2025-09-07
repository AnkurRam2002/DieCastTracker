#!/bin/bash
# DieCastTracker - Linux/Mac Shell Script Runner
# Hot Wheels Collection Management System

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print banner
print_banner() {
    echo -e "${CYAN}🚗==================================================🚗${NC}"
    echo -e "${CYAN}     HOT WHEELS DIE-CAST TRACKER${NC}"
    echo -e "${CYAN}     Collection Management System${NC}"
    echo -e "${CYAN}🚗==================================================🚗${NC}"
    echo
}

# Function to print menu
print_menu() {
    echo -e "${YELLOW}📋 QUICK COMMANDS${NC}"
    echo "--------------------------------"
    echo "1. 🆕 Add New Model"
    echo "2. 🔍 Search Models"
    echo "3. 📊 View Statistics"
    echo "4. ➕ Add New Field"
    echo "5. 📁 Open Excel File"
    echo "6. 🚀 Launch Main Menu"
    echo "7. ❓ Help"
    echo "8. 🚪 Exit"
    echo "--------------------------------"
}

# Function to run Python script
run_script() {
    local script=$1
    local script_path="scripts/$script"
    if [ -f "$script_path" ]; then
        echo -e "${GREEN}🚀 Running $script...${NC}"
        python3 "$script_path"
    else
        echo -e "${RED}❌ Script '$script' not found!${NC}"
    fi
}

# Function to open Excel file
open_excel() {
    if [ -f "data/HW_list.xlsx" ]; then
        echo -e "${GREEN}📁 Opening Excel file...${NC}"
        if command -v xdg-open > /dev/null; then
            xdg-open "data/HW_list.xlsx"
        elif command -v open > /dev/null; then
            open "data/HW_list.xlsx"
        else
            echo -e "${YELLOW}⚠️  No suitable application found to open Excel file${NC}"
        fi
        echo -e "${GREEN}✅ Excel file opened!${NC}"
    else
        echo -e "${RED}❌ Excel file not found!${NC}"
    fi
}

# Function to show help
show_help() {
    echo -e "${BLUE}📖 HELP & INFORMATION${NC}"
    echo "=================================================="
    echo -e "${BLUE}🚗 DieCastTracker - Hot Wheels Collection Manager${NC}"
    echo
    echo -e "${YELLOW}📁 Available Commands:${NC}"
    echo "  • add_model.py    - Add new cars to collection"
    echo "  • search_model.py - Search for existing cars"
    echo "  • statistics.py   - View collection statistics"
    echo "  • add_field.py    - Add new fields to database"
    echo "  • main.py         - Interactive main menu"
    echo
    echo -e "${YELLOW}💡 Usage Tips:${NC}"
    echo "  • Use shortcuts like 'Car Name#13' when adding models"
    echo "  • Statistics show collection progress and insights"
    echo "  • Excel file is auto-created if it doesn't exist"
    echo "=================================================="
}

# Main loop
print_banner

while true; do
    print_menu
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            echo
            run_script "add_model.py"
            ;;
        2)
            echo
            run_script "search_model.py"
            ;;
        3)
            echo
            run_script "statistics.py"
            ;;
        4)
            echo
            run_script "add_field.py"
            ;;
        5)
            echo
            open_excel
            ;;
        6)
            echo
            echo -e "${GREEN}🚀 Launching Main Menu...${NC}"
            python3 main.py
            ;;
        7)
            echo
            show_help
            ;;
        8)
            echo
            echo -e "${GREEN}👋 Thank you for using DieCastTracker!${NC}"
            echo -e "${GREEN}🚗 Happy collecting!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice! Please enter a number between 1-8.${NC}"
            echo
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
    echo
done
