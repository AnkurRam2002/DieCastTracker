#!/usr/bin/env python3
"""
DieCastTracker - Delete Model Script
Delete models from the collection with automatic backup
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scripts.cli_utils import (
    ExcelManager, DisplayUtils, InputUtils, SearchUtils, BackupUtils,
    print_success, print_error, print_info, print_warning
)

class DeleteModelApp:
    """Application class for deleting models"""
    
    def __init__(self):
        self.excel_manager = ExcelManager()
        self.wb, self.ws, self.headers, self.data = self.excel_manager.load_workbook_data()
        
        if self.wb is None:
            print_error("Cannot load Excel file. Exiting.")
            sys.exit(1)
    
    def delete_model_from_worksheet(self, row_index: int):
        """Delete a model from the worksheet"""
        # Delete the row (shift rows up)
        self.ws.delete_rows(row_index + 2)  # +2 because Excel is 1-indexed and we skip header

    def renumber_serial_numbers(self):
        """Renumber serial numbers after deletion"""
        for i, row in enumerate(self.data):
            self.ws.cell(row=i + 2, column=1, value=i + 1)  # Update serial number

    def delete_by_serial(self):
        """Delete model by serial number"""
        try:
            serial_no = InputUtils.get_serial_number("\nEnter Serial Number to delete: ")
            if serial_no is None:
                return
            
            row_index, model_data = SearchUtils.find_model_by_serial(self.data, serial_no)
            
            if row_index is None:
                print_error(f"Model with Serial Number {serial_no} not found!")
                return
            
            self.show_model_details(model_data, "Model to Delete")
            
            # Create backup before deletion
            print_info("Creating backup before deletion...")
            if not BackupUtils.create_backup_if_needed():
                print_error("Backup failed! Deletion cancelled for safety.")
                return
            
            # Confirm deletion
            print_warning("WARNING: This will permanently delete the model!")
            print(f"Model: {model_data[1]} (S.No: {model_data[0]})")
            
            if InputUtils.confirm_action("Are you sure you want to delete this model?"):
                # Double confirmation
                double_confirm = input("⚠️  This action cannot be undone. Type 'DELETE' to confirm: ").strip()
                if double_confirm == 'DELETE':
                    self.delete_model_from_worksheet(row_index)
                    
                    # Remove from data list
                    self.data.pop(row_index)
                    
                    # Renumber serial numbers
                    self.renumber_serial_numbers()
                    
                    if self.excel_manager.save_workbook(self.wb):
                        print_success("Model deleted successfully!")
                        print_success("Serial numbers have been renumbered.")
                    else:
                        print_error("Failed to save changes!")
                else:
                    print_info("Deletion cancelled.")
            else:
                print_info("Deletion cancelled.")
                
        except Exception as e:
            print_error(f"Error deleting model: {e}")
    
    def search_and_delete(self):
        """Search for models and delete"""
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
            choice = int(input(f"\nSelect model to delete (1-{len(matches)}): "))
            if 1 <= choice <= len(matches):
                row_index, model_data = matches[choice - 1]
                
                self.show_model_details(model_data, "Model to Delete")
                
                # Create backup before deletion
                print_info("Creating backup before deletion...")
                if not BackupUtils.create_backup_if_needed():
                    print_error("Backup failed! Deletion cancelled for safety.")
                    return
                
                # Confirm deletion
                print_warning("WARNING: This will permanently delete the model!")
                print(f"Model: {model_data[1]} (S.No: {model_data[0]})")
                
                if InputUtils.confirm_action("Are you sure you want to delete this model?"):
                    # Double confirmation
                    double_confirm = input("⚠️  This action cannot be undone. Type 'DELETE' to confirm: ").strip()
                    if double_confirm == 'DELETE':
                        self.delete_model_from_worksheet(row_index)
                        
                        # Remove from data list
                        self.data.pop(row_index)
                        
                        # Renumber serial numbers
                        self.renumber_serial_numbers()
                        
                        if self.excel_manager.save_workbook(self.wb):
                            print_success("Model deleted successfully!")
                            print_success("Serial numbers have been renumbered.")
                        else:
                            print_error("Failed to save changes!")
                    else:
                        print_info("Deletion cancelled.")
                else:
                    print_info("Deletion cancelled.")
            else:
                print_error("Invalid selection!")
        except ValueError:
            print_error("Please enter a valid number!")
        except Exception as e:
            print_error(f"Error deleting model: {e}")
    
    def show_model_details(self, model_data: list, title: str):
        """Show model details in a formatted way"""
        print(f"\n📋 {title}:")
        for i, header in enumerate(self.headers):
            if i < len(model_data):
                print(f"{header}: {model_data[i]}")
    
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
        DisplayUtils.print_header("🗑️  HOT WHEELS MODEL DELETER", 50)
        
        if not self.data:
            print_warning("No models to delete!")
            return
        
        # Display current models
        DisplayUtils.display_models_table(self.data, self.headers, "Current Collection")
        
        while True:
            DisplayUtils.print_section("🗑️  DELETE OPTIONS")
            print("1. Delete by Serial Number")
            print("2. Search and Delete")
            print("3. View All Models Again")
            print("4. Exit")
            
            choice = InputUtils.get_choice("Enter your choice (1-4): ", ['1', '2', '3', '4'])
            
            if choice == '1':
                self.delete_by_serial()
            elif choice == '2':
                self.search_and_delete()
            elif choice == '3':
                DisplayUtils.display_models_table(self.data, self.headers, "Current Collection")
            elif choice == '4':
                print_success("Delete session ended. Thank you!")
                break

def main():
    """Main entry point"""
    try:
        app = DeleteModelApp()
        app.run()
    except Exception as e:
        print_error(f"Application error: {e}")

if __name__ == "__main__":
    main()

