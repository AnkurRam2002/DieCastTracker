#!/usr/bin/env python3
"""
DieCastTracker - Main Launcher
Hot Wheels Collection Management System
"""

import os
import sys
import subprocess
from datetime import datetime
from typing import Dict, Callable

# Import our utilities
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))
from cli_utils import (
    DisplayUtils, InputUtils, print_success, print_error, 
    print_info, pause_for_user, clear_screen
)

class DieCastTrackerApp:
    """Main application class for DieCast Tracker CLI"""
    
    def __init__(self):
        self.script_mapping = {
            '1': ('add_model.py', 'Add New Model'),
            '2': ('update_model.py', 'Update Model'),
            '3': ('delete_model.py', 'Delete Model'),
            '4': ('search_model.py', 'Search Models'),
            '5': ('statistics.py', 'View Statistics'),
            '6': ('add_field.py', 'Add New Field'),
            '9': ('manage_series.py', 'Manage Series Configuration')
        }
    
    def print_banner(self):
        """Print the application banner"""
        print("🚗" + "="*50 + "🚗")
        print("    HOT WHEELS DIE-CAST TRACKER")
        print("    Collection Management System")
        print("🚗" + "="*50 + "🚗")
        print()
    
    def print_menu(self):
        """Print the main menu"""
        DisplayUtils.print_section("📋 MAIN MENU")
        print("1. 🆕 Add New Model")
        print("2. ✏️  Update Model")
        print("3. 🗑️  Delete Model")
        print("4. 🔍 Search Models")
        print("5. 📊 View Statistics")
        print("6. ➕ Add New Field")
        print("7. 📁 Open Excel File")
        print("8. ❓ Help & Info")
        print("9. 🔧 Manage Series Configuration")
        print("10. 🚪 Exit")
    
    def run_script(self, script_name: str, script_display_name: str):
        """Run a Python script with improved error handling"""
        try:
            script_path = os.path.join('scripts', script_name)
            if not os.path.exists(script_path):
                print_error(f"Script '{script_name}' not found!")
                return False
            
            print_info(f"Running {script_display_name}...")
            DisplayUtils.print_section("", 40)
            
            result = subprocess.run([sys.executable, script_path], check=True)
            return result.returncode == 0
            
        except subprocess.CalledProcessError as e:
            print_error(f"Error running {script_display_name}: {e}")
            return False
        except KeyboardInterrupt:
            print_info(f"{script_display_name} interrupted by user")
            return False
        except Exception as e:
            print_error(f"Unexpected error: {e}")
            return False
    
    def open_excel_file(self):
        """Open the Excel file with default application"""
        file_path = os.path.join('data', 'HW_list.xlsx')
        if not os.path.exists(file_path):
            print_error("Excel file 'HW_list.xlsx' not found!")
            return
        
        try:
            if sys.platform.startswith('win'):
                os.startfile(file_path)
            elif sys.platform.startswith('darwin'):  # macOS
                subprocess.run(['open', file_path])
            else:  # Linux
                subprocess.run(['xdg-open', file_path])
            print_success("Excel file opened successfully!")
        except Exception as e:
            print_error(f"Could not open Excel file: {e}")
    
    def show_help(self):
        """Show help and information"""
        DisplayUtils.print_header("📖 HELP & INFORMATION", 50)
        print("🚗 DieCastTracker - Hot Wheels Collection Manager")
        print()
        print("📁 Available Scripts:")
        for script_file, description in self.script_mapping.values():
            print(f"  • {script_file:<20} - {description}")
        print("  • manage_series.py      - Manage Series Configuration")
        print()
        print("💡 Tips:")
        print("  • Use shortcuts like 'Car Name#13' when adding models")
        print("  • Statistics show your collection progress and insights")
        print("  • Excel file is automatically created if it doesn't exist")
        print("  • All operations create automatic backups for safety")
        print()
        print("🔧 Technical Info:")
        print(f"  • Python Version: {sys.version.split()[0]}")
        print(f"  • Working Directory: {os.getcwd()}")
        print(f"  • Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)

    def run(self):
        """Main application loop"""
        self.print_banner()
        
        while True:
            try:
                self.print_menu()
                choice = InputUtils.get_choice("Enter your choice (1-10): ", 
                                             [str(i) for i in range(1, 11)])
                
                if choice in self.script_mapping:
                    script_file, script_name = self.script_mapping[choice]
                    success = self.run_script(script_file, script_name)
                    
                    # Pause before showing menu again for interactive scripts
                    if choice in ['1', '2', '3', '4']:
                        pause_for_user()
                        print("\n" + "="*60 + "\n")
                        
                elif choice == '7':
                    self.open_excel_file()
                    pause_for_user()
                    print("\n" + "="*60 + "\n")
                    
                elif choice == '8':
                    self.show_help()
                    pause_for_user()
                    print("\n" + "="*60 + "\n")
                    
                elif choice == '10':
                    print("\n👋 Thank you for using DieCastTracker!")
                    print("🚗 Happy collecting!")
                    break
                    
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye! Thanks for using DieCastTracker!")
                break
            except Exception as e:
                print_error(f"An error occurred: {e}")
                pause_for_user()

def main():
    """Main entry point"""
    app = DieCastTrackerApp()
    app.run()

if __name__ == "__main__":
    main()
