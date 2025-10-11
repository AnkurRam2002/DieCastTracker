#!/usr/bin/env python3
"""
DieCastTracker - Update Model Script
Update existing models in the collection with automatic backup
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scripts.cli_utils import (
    ExcelManager, DisplayUtils, InputUtils, SearchUtils, BackupUtils,
    print_success, print_error, print_info, print_warning
)

class UpdateModelApp:
    """Application class for updating models"""
    
    def __init__(self):
        self.excel_manager = ExcelManager()
        self.wb, self.ws, self.headers, self.data = self.excel_manager.load_workbook_data()
        
        if self.wb is None:
            print_error("Cannot load Excel file. Exiting.")
            sys.exit(1)
    
    def update_model_in_worksheet(self, row_index: int, new_data: list):
        """Update a model in the worksheet"""
        for col_index, value in enumerate(new_data, 1):
            if col_index <= len(self.headers):
                self.ws.cell(row=row_index + 2, column=col_index, value=value)  # +2 because Excel is 1-indexed and we skip header

    def update_by_serial(self):
        """Update model by serial number"""
        try:
            serial_no = InputUtils.get_serial_number("\nEnter Serial Number to update: ")
            if serial_no is None:
                return
            
            row_index, model_data = SearchUtils.find_model_by_serial(self.data, serial_no)
            
            if row_index is None:
                print_error(f"Model with Serial Number {serial_no} not found!")
                return
            
            self.show_model_details(model_data, "Current Model Details")
            
            # Create backup before update
            print_info("Creating backup before update...")
            if not BackupUtils.create_backup_if_needed():
                print_error("Backup failed! Update cancelled for safety.")
                return
            
            # Get new values
            new_data = self.get_updated_values(model_data)
            
            # Confirm update
            self.show_model_details(new_data, "New Model Details")
            
            if InputUtils.confirm_action("Confirm update?"):
                self.update_model_in_worksheet(row_index, new_data)
                if self.excel_manager.save_workbook(self.wb):
                    print_success("Model updated successfully!")
                    # Update the data list
                    self.data[row_index] = new_data
                else:
                    print_error("Failed to save changes!")
            else:
                print_info("Update cancelled.")
                
        except Exception as e:
            print_error(f"Error updating model: {e}")
    
    def search_and_update(self):
        """Search for models and update"""
        search_term = input("\nEnter search term (model name, brand, or series): ").strip()
        if not search_term:
            print_error("Search term cannot be empty!")
            return
        
        # Find matching models
        matches = SearchUtils.search_models(self.data, search_term)
        
        if not matches:
            print_error("No matching models found!")
            return
        
        self.display_search_results(matches)
        
        try:
            choice = int(input(f"\nSelect model to update (1-{len(matches)}): "))
            if 1 <= choice <= len(matches):
                row_index, model_data = matches[choice - 1]
                
                self.show_model_details(model_data, "Selected Model")
                
                # Create backup before update
                print_info("Creating backup before update...")
                if not BackupUtils.create_backup_if_needed():
                    print_error("Backup failed! Update cancelled for safety.")
                    return
                
                # Get new values
                new_data = self.get_updated_values(model_data)
                
                # Confirm update
                self.show_model_details(new_data, "New Model Details")
                
                if InputUtils.confirm_action("Confirm update?"):
                    self.update_model_in_worksheet(row_index, new_data)
                    if self.excel_manager.save_workbook(self.wb):
                        print_success("Model updated successfully!")
                        # Update the data list
                        self.data[row_index] = new_data
                    else:
                        print_error("Failed to save changes!")
                else:
                    print_info("Update cancelled.")
            else:
                print_error("Invalid selection!")
        except ValueError:
            print_error("Please enter a valid number!")
        except Exception as e:
            print_error(f"Error updating model: {e}")
    
    def show_model_details(self, model_data: list, title: str):
        """Show model details in a formatted way"""
        print(f"\n📋 {title}:")
        for i, header in enumerate(self.headers):
            if i < len(model_data):
                print(f"{header}: {model_data[i]}")
    
    def get_updated_values(self, current_data: list):
        """Get updated values from user"""
        print(f"\n✏️  Enter new values (press Enter to keep current):")
        new_data = list(current_data)
        
        for i, header in enumerate(self.headers):
            if i < len(new_data):
                current_value = new_data[i]
                new_value = input(f"{header} (current: {current_value}): ").strip()
                if new_value:
                    new_data[i] = new_value
        
        return new_data
    
    def display_search_results(self, matches: list):
        """Display search results"""
        print(f"\n🔍 Found {len(matches)} matching model(s):")
        DisplayUtils.print_section("", 60)
        for i, (row_index, row) in enumerate(matches):
            serial_no = row[0] if len(row) > 0 else "N/A"
            model_name = row[1] if len(row) > 1 else "N/A"
            series = row[2] if len(row) > 2 else "N/A"
            print(f"{i+1}. S.No: {serial_no} | {model_name} | {series}")
    
    def run(self):
        """Main application loop"""
        DisplayUtils.print_header("🔄 HOT WHEELS MODEL UPDATER", 50)
        
        if not self.data:
            print_warning("No models to update!")
            return
        
        # Display current models
        DisplayUtils.display_models_table(self.data, self.headers, "Current Collection")
        
        while True:
            DisplayUtils.print_section("📝 UPDATE OPTIONS")
            print("1. Update by Serial Number")
            print("2. Search and Update")
            print("3. View All Models Again")
            print("4. Exit")
            
            choice = InputUtils.get_choice("Enter your choice (1-4): ", ['1', '2', '3', '4'])
            
            if choice == '1':
                self.update_by_serial()
            elif choice == '2':
                self.search_and_update()
            elif choice == '3':
                DisplayUtils.display_models_table(self.data, self.headers, "Current Collection")
            elif choice == '4':
                print_success("Update session ended. Thank you!")
                break

def main():
    """Main entry point"""
    try:
        app = UpdateModelApp()
        app.run()
    except Exception as e:
        print_error(f"Application error: {e}")

if __name__ == "__main__":
    main()

