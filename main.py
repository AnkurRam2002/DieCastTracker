#!/usr/bin/env python3
"""
DieCastTracker - CLI Interface
Interactive command-line interface for managing Hot Wheels collection
"""

import os
import sys

# Add pages directories to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'add-model'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'add-field'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'analytics'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'home'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'series-management'))

from add_model import add_model
from add_field import add_field
from analytics import get_collection_statistics
from home import search_models, update_model, delete_model, load_excel_data
from series_config import SERIES_OPTIONS, get_all_series, get_subseries

# Path to the Excel file
EXCEL_FILE_PATH = os.path.join("data", "HW_list.xlsx")

def print_header():
    """Print the application header"""
    print("=" * 60)
    print("  DieCast Tracker - Hot Wheels Collection Manager")
    print("=" * 60)
    print()

def print_menu():
    """Print the main menu"""
    print("MAIN MENU")
    print("-" * 60)
    print("1. Add New Model")
    print("2. Search Models")
    print("3. View Statistics")
    print("4. Add New Field")
    print("5. Update Model")
    print("6. Delete Model")
    print("7. Open Excel File")
    print("8. Help & Information")
    print("9. Exit")
    print("-" * 60)

def add_model_interactive():
    """Interactive function to add a new model"""
    print("\nADD NEW MODEL")
    print("-" * 60)
    
    try:
        # Get model name
        model_name = input("Enter model name: ").strip()
        if not model_name:
            print("[ERROR] Model name cannot be empty!")
            return
        
        # Get main series
        print("\nSelect Main Series:")
        main_series_list = get_all_series()
        for idx, series in enumerate(main_series_list, 1):
            print(f"  {idx}. {series}")
        
        try:
            series_choice = int(input(f"\nEnter choice (1-{len(main_series_list)}): "))
            if series_choice < 1 or series_choice > len(main_series_list):
                print("[ERROR] Invalid choice!")
                return
            main_series = main_series_list[series_choice - 1]
        except ValueError:
            print("[ERROR] Invalid input! Please enter a number.")
            return
        
        # Get subseries
        print(f"\nSelect Subseries for '{main_series}':")
        subseries_list = get_subseries(main_series)
        for idx, subseries in enumerate(subseries_list, 1):
            print(f"  {idx}. {subseries}")
        
        try:
            subseries_choice = int(input(f"\nEnter choice (1-{len(subseries_list)}): "))
            if subseries_choice < 1 or subseries_choice > len(subseries_list):
                print("[ERROR] Invalid choice!")
                return
            subseries = subseries_list[subseries_choice - 1]
        except ValueError:
            print("[ERROR] Invalid input! Please enter a number.")
            return
        
        # Add the model
        result = add_model(model_name, main_series, subseries)
        if result.get("success"):
            print(f"\n[SUCCESS] {result.get('message')}")
            print(f"   Serial Number: {result.get('serial_number')}")
        else:
            print(f"\n[ERROR] {result.get('error', 'Unknown error')}")
    
    except KeyboardInterrupt:
        print("\n\n[WARNING] Operation cancelled by user.")
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")

def search_models_interactive():
    """Interactive function to search models"""
    print("\nSEARCH MODELS")
    print("-" * 60)
    
    try:
        query = input("Enter search term (leave empty for all models): ").strip()
        
        results = search_models(query)
        
        if not results:
            print("\nNo models found.")
        else:
            print(f"\nFound {len(results)} model(s):")
            print("-" * 60)
            
            # Display results
            for model in results[:20]:  # Show first 20 results
                serial = model.get('S.No', model.get(list(model.keys())[0] if model else None, 'N/A'))
                model_name = model.get('Model Name', model.get(list(model.keys())[1] if len(model) > 1 else None, 'N/A'))
                series = model.get('Series', model.get(list(model.keys())[2] if len(model) > 2 else None, 'N/A'))
                print(f"  #{serial}: {model_name} [{series}]")
            
            if len(results) > 20:
                print(f"\n  ... and {len(results) - 20} more results")
    
    except KeyboardInterrupt:
        print("\n\n[WARNING] Operation cancelled by user.")
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")

def view_statistics():
    """Display collection statistics"""
    print("\nCOLLECTION STATISTICS")
    print("-" * 60)
    
    try:
        stats = get_collection_statistics()
        
        # Total models
        total = stats.get('total_models', 0)
        print(f"\nTotal Models: {total}")
        
        # Main series breakdown
        main_series_breakdown = stats.get('main_series_breakdown', {})
        if main_series_breakdown:
            print("\nMain Series Breakdown:")
            for series, count in sorted(main_series_breakdown.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total * 100) if total > 0 else 0
                bar = "=" * int(percentage / 2)
                print(f"  {series:20s}: {count:4d} ({percentage:5.1f}%) {bar}")
        
        # Subseries breakdown (top 10)
        series_breakdown = stats.get('series_breakdown', {})
        if series_breakdown:
            print("\nTop Subseries:")
            top_subseries = sorted(series_breakdown.items(), key=lambda x: x[1], reverse=True)[:10]
            for subseries, count in top_subseries:
                percentage = (count / total * 100) if total > 0 else 0
                print(f"  {subseries:30s}: {count:4d} ({percentage:5.1f}%)")
        
        # Collection goals
        goals = stats.get('collection_goals', {})
        if goals:
            current = goals.get('current_count', 0)
            next_milestone = goals.get('next_milestone')
            progress = goals.get('progress_percentage', 0)
            if next_milestone:
                print(f"\nNext Milestone: {next_milestone} models")
                print(f"   Progress: {current}/{next_milestone} ({progress:.1f}%)")
                remaining = next_milestone - current
                if remaining > 0:
                    print(f"   Remaining: {remaining} models to go!")
        
        # Recent additions
        recent = stats.get('recent_additions', [])
        if recent:
            print("\nRecent Additions (last 5):")
            for model in recent[:5]:
                serial = model.get('S.No', 'N/A')
                model_name = model.get('Model Name', 'N/A')
                series = model.get('Series', 'N/A')
                print(f"  #{serial}: {model_name} [{series}]")
        
        # Collection insights
        insights = stats.get('collection_insights', {})
        if insights:
            print("\nCollection Insights:")
            diversity = insights.get('diversity_score', 0)
            print(f"   Diversity Score: {diversity:.1f}%")
            
            coverage = insights.get('series_coverage', {})
            if coverage:
                covered = coverage.get('covered', 0)
                total_series = coverage.get('total', 0)
                print(f"   Series Coverage: {covered}/{total_series} ({coverage.get('percentage', 0):.1f}%)")
    
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")

def add_field_interactive():
    """Interactive function to add a new field"""
    print("\nADD NEW FIELD")
    print("-" * 60)
    
    try:
        field_name = input("Enter field name: ").strip()
        if not field_name:
            print("[ERROR] Field name cannot be empty!")
            return
        
        result = add_field(field_name)
        if result.get("success"):
            print(f"\n[SUCCESS] {result.get('message')}")
        else:
            print(f"\n[ERROR] {result.get('error', 'Unknown error')}")
    
    except KeyboardInterrupt:
        print("\n\n[WARNING] Operation cancelled by user.")
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")

def update_model_interactive():
    """Interactive function to update a model"""
    print("\nUPDATE MODEL")
    print("-" * 60)
    
    try:
        serial_input = input("Enter serial number to update: ").strip()
        if not serial_input:
            print("[ERROR] Serial number cannot be empty!")
            return
        
        serial_number = int(serial_input)
        
        # Load data to show current values
        df = load_excel_data()
        if df is None:
            print("[ERROR] No data found!")
            return
        
        # Find the model
        model_row = None
        for idx, row in df.iterrows():
            if row.get('S.No') == serial_number:
                model_row = row
                break
        
        if model_row is None:
            print(f"[ERROR] Model with serial number {serial_number} not found!")
            return
        
        print(f"\nCurrent Model Information:")
        for col, val in model_row.items():
            print(f"  {col}: {val}")
        
        print("\nEnter updates (leave empty to skip):")
        updates = {}
        for col in df.columns:
            if col == 'S.No':
                continue
            new_value = input(f"  {col} (current: {model_row.get(col, '')}): ").strip()
            if new_value:
                updates[col] = new_value
        
        if not updates:
            print("\n[WARNING] No updates provided.")
            return
        
        # Confirm update
        confirm = input(f"\n[WARNING] Update model #{serial_number}? (yes/no): ").strip().lower()
        if confirm not in ['yes', 'y']:
            print("[INFO] Update cancelled.")
            return
        
        update_model(serial_number, updates)
        print(f"\n[SUCCESS] Model #{serial_number} updated successfully!")
    
    except ValueError:
        print("[ERROR] Invalid serial number!")
    except KeyboardInterrupt:
        print("\n\n[WARNING] Operation cancelled by user.")
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")

def delete_model_interactive():
    """Interactive function to delete a model"""
    print("\nDELETE MODEL")
    print("-" * 60)
    
    try:
        serial_input = input("Enter serial number to delete: ").strip()
        if not serial_input:
            print("[ERROR] Serial number cannot be empty!")
            return
        
        serial_number = int(serial_input)
        
        # Load data to show model info
        df = load_excel_data()
        if df is None:
            print("[ERROR] No data found!")
            return
        
        # Find the model
        model_row = None
        for idx, row in df.iterrows():
            if row.get('S.No') == serial_number:
                model_row = row
                break
        
        if model_row is None:
            print(f"[ERROR] Model with serial number {serial_number} not found!")
            return
        
        print(f"\nModel to Delete:")
        model_name = model_row.get('Model Name', 'N/A')
        series = model_row.get('Series', 'N/A')
        print(f"  Serial Number: {serial_number}")
        print(f"  Model Name: {model_name}")
        print(f"  Series: {series}")
        
        # Double confirmation
        confirm1 = input(f"\n[WARNING] Are you sure you want to delete model #{serial_number}? (yes/no): ").strip().lower()
        if confirm1 not in ['yes', 'y']:
            print("[INFO] Deletion cancelled.")
            return
        
        confirm2 = input(f"[WARNING] Final confirmation - type 'DELETE' to confirm: ").strip()
        if confirm2 != 'DELETE':
            print("[INFO] Deletion cancelled.")
            return
        
        delete_model(serial_number)
        print(f"\n[SUCCESS] Model #{serial_number} deleted successfully!")
    
    except ValueError:
        print("[ERROR] Invalid serial number!")
    except KeyboardInterrupt:
        print("\n\n[WARNING] Operation cancelled by user.")
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")

def open_excel_file():
    """Open the Excel file"""
    print("\nOPEN EXCEL FILE")
    print("-" * 60)
    
    try:
        if not os.path.exists(EXCEL_FILE_PATH):
            print(f"[ERROR] Excel file not found: {EXCEL_FILE_PATH}")
            print("   The file will be created when you add your first model.")
            return
        
        # Try to open the file
        if sys.platform == "win32":
            os.startfile(EXCEL_FILE_PATH)
        elif sys.platform == "darwin":
            os.system(f"open {EXCEL_FILE_PATH}")
        else:
            os.system(f"xdg-open {EXCEL_FILE_PATH}")
        
        print(f"[SUCCESS] Opening Excel file: {EXCEL_FILE_PATH}")
    
    except Exception as e:
        print(f"[ERROR] Error opening file: {str(e)}")

def show_help():
    """Show help and information"""
    print("\nHELP & INFORMATION")
    print("-" * 60)
    print("""
DieCast Tracker - Hot Wheels Collection Manager

[FEATURES]
  • Add new models with series/subseries selection
  • Search and filter your collection
  • View comprehensive statistics and analytics
  • Add custom fields to track additional data
  • Update existing models
  • Delete models with safety confirmations
  • Automatic backups before any changes

[DATA]
  • Data stored in: data/HW_list.xlsx
  • Backups stored in: data/backups/
  • All operations create automatic backups

[USAGE]
  • Use the menu numbers to navigate
  • Press Ctrl+C to cancel any operation
  • All changes are saved automatically

[SUPPORT]
  • Check README.md for detailed documentation
  • Web interface available at: http://localhost:8000
  • Run 'python start_web.py' to start web interface
    """)

def main():
    """Main CLI interface loop"""
    print_header()
    
    while True:
        try:
            print_menu()
            choice = input("\nEnter your choice (1-9): ").strip()
            
            if choice == "1":
                add_model_interactive()
            elif choice == "2":
                search_models_interactive()
            elif choice == "3":
                view_statistics()
            elif choice == "4":
                add_field_interactive()
            elif choice == "5":
                update_model_interactive()
            elif choice == "6":
                delete_model_interactive()
            elif choice == "7":
                open_excel_file()
            elif choice == "8":
                show_help()
            elif choice == "9":
                print("\nThank you for using DieCast Tracker!")
                print("   Happy collecting!")
                break
            else:
                print("\n[ERROR] Invalid choice! Please enter a number between 1 and 9.")
            
            if choice != "9":
                input("\nPress Enter to continue...")
                print("\n" * 2)
        
        except KeyboardInterrupt:
            print("\n\nGoodbye! Thank you for using DieCast Tracker!")
            break
        except Exception as e:
            print(f"\n[ERROR] Unexpected error: {str(e)}")
            input("\nPress Enter to continue...")
            print("\n" * 2)

if __name__ == "__main__":
    main()

