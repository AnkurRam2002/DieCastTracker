#!/usr/bin/env python3
"""
DieCastTracker - Main Launcher
Hot Wheels Collection Management System
"""

import os
import sys
import subprocess
from datetime import datetime

def print_banner():
    """Print the application banner"""
    print("🚗" + "="*50 + "🚗")
    print("    HOT WHEELS DIE-CAST TRACKER")
    print("    Collection Management System")
    print("🚗" + "="*50 + "🚗")
    print()

def print_menu():
    """Print the main menu"""
    print("📋 MAIN MENU")
    print("-" * 30)
    print("1. 🆕 Add New Model")
    print("2. 🔍 Search Models")
    print("3. 📊 View Statistics")
    print("4. ➕ Add New Field")
    print("5. 📁 Open Excel File")
    print("6. ❓ Help & Info")
    print("7. 🚪 Exit")
    print("-" * 30)

def run_script(script_name):
    """Run a Python script"""
    try:
        script_path = os.path.join('scripts', script_name)
        if os.path.exists(script_path):
            print(f"🚀 Running {script_name}...")
            print("-" * 40)
            subprocess.run([sys.executable, script_path], check=True)
        else:
            print(f"❌ Script '{script_name}' not found!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running {script_name}: {e}")
    except KeyboardInterrupt:
        print(f"\n⏹️  {script_name} interrupted by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def open_excel_file():
    """Open the Excel file with default application"""
    file_path = os.path.join('data', 'HW_list.xlsx')
    if os.path.exists(file_path):
        try:
            if sys.platform.startswith('win'):
                os.startfile(file_path)
            elif sys.platform.startswith('darwin'):  # macOS
                subprocess.run(['open', file_path])
            else:  # Linux
                subprocess.run(['xdg-open', file_path])
            print("✅ Excel file opened successfully!")
        except Exception as e:
            print(f"❌ Could not open Excel file: {e}")
    else:
        print("❌ Excel file 'HW_list.xlsx' not found!")

def show_help():
    """Show help and information"""
    print("📖 HELP & INFORMATION")
    print("=" * 50)
    print("🚗 DieCastTracker - Hot Wheels Collection Manager")
    print()
    print("📁 Available Scripts:")
    print("  • add_model.py    - Add new cars to your collection")
    print("  • search_model.py - Search for existing cars")
    print("  • statistics.py   - View collection statistics")
    print("  • add_field.py    - Add new fields to the database")
    print()
    print("💡 Tips:")
    print("  • Use shortcuts like 'Car Name#13' when adding models")
    print("  • Statistics show your collection progress and insights")
    print("  • Excel file is automatically created if it doesn't exist")
    print()
    print("🔧 Technical Info:")
    print(f"  • Python Version: {sys.version}")
    print(f"  • Working Directory: {os.getcwd()}")
    print(f"  • Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

def main():
    """Main application loop"""
    print_banner()
    
    while True:
        print_menu()
        
        try:
            choice = input("Enter your choice (1-7): ").strip()
            
            if choice == '1':
                run_script('add_model.py')
            elif choice == '2':
                run_script('search_model.py')
            elif choice == '3':
                run_script('statistics.py')
            elif choice == '4':
                run_script('add_field.py')
            elif choice == '5':
                open_excel_file()
            elif choice == '6':
                show_help()
            elif choice == '7':
                print("\n👋 Thank you for using DieCastTracker!")
                print("🚗 Happy collecting!")
                break
            else:
                print("❌ Invalid choice! Please enter a number between 1-7.")
            
            # Pause before showing menu again
            if choice in ['1', '2', '3', '4']:
                input("\n⏸️  Press Enter to return to main menu...")
                print("\n" + "="*60 + "\n")
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye! Thanks for using DieCastTracker!")
            break
        except Exception as e:
            print(f"❌ An error occurred: {e}")
            input("Press Enter to continue...")

if __name__ == "__main__":
    main()
