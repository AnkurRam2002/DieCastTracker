#!/usr/bin/env python3
"""
DieCastTracker - Add Field Script
Add new fields/columns to the Hot Wheels collection database
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scripts.cli_utils import (
    ExcelManager, DisplayUtils, InputUtils,
    print_success, print_error, print_info, print_warning
)

class AddFieldApp:
    """Application class for adding new fields to the database"""
    
    def __init__(self):
        self.excel_manager = ExcelManager()
        self.wb, self.ws, self.headers, self.data = self.excel_manager.load_workbook_data()
        
        if self.wb is None:
            print_error("Cannot load Excel file. Exiting.")
            sys.exit(1)
    
    def show_current_fields(self):
        """Display current fields in the database"""
        print("📑 Current fields (columns):")
        for i, header in enumerate(self.headers, start=1):
            print(f"{i}. {header}")
    
    def validate_field_name(self, field_name: str) -> bool:
        """Validate the field name"""
        if not field_name.strip():
            print_error("Field name cannot be empty!")
            return False
        
        if len(field_name) > 50:
            print_error("Field name is too long! Maximum 50 characters.")
            return False
        
        # Check for invalid characters
        invalid_chars = ['/', '\\', '?', '*', '[', ']', ':', ';']
        if any(char in field_name for char in invalid_chars):
            print_error(f"Field name contains invalid characters: {', '.join(invalid_chars)}")
            return False
        
        return True
    
    def add_new_field(self, field_name: str):
        """Add a new field to the database"""
        # Check if the field already exists
        if field_name in self.headers:
            print_warning(f"The field '{field_name}' already exists. No changes made.")
            return False
        
        # Add the new field
        new_column = len(self.headers) + 1
        self.ws.cell(row=1, column=new_column, value=field_name)
        
        # Save the file
        if self.excel_manager.save_workbook(self.wb):
            print_success(f"Field '{field_name}' added as column {new_column}.")
            print_success("Excel file updated successfully.")
            return True
        else:
            print_error("Failed to save Excel file!")
            return False
    
    def show_field_suggestions(self):
        """Show common field suggestions"""
        suggestions = [
            "Brand", "Color", "Year", "Condition", "Purchase Price",
            "Purchase Date", "Store", "Notes", "Rating", "Rarity",
            "Box Condition", "Card Number", "Country", "Manufacturer"
        ]
        
        print("\n💡 Common field suggestions:")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"  {i}. {suggestion}")
    
    def run(self):
        """Main application loop"""
        DisplayUtils.print_header("➕ ADD NEW FIELD", 50)
        
        # Show current fields
        self.show_current_fields()
        
        while True:
            print("\n" + "="*50)
            print("Options:")
            print("1. Add new field")
            print("2. Show field suggestions")
            print("3. View current fields again")
            print("4. Exit")
            
            choice = InputUtils.get_choice("Enter your choice (1-4): ", ['1', '2', '3', '4'])
            
            if choice == '1':
                field_name = input("\nEnter the name of the new field: ").strip()
                
                if self.validate_field_name(field_name):
                    if self.add_new_field(field_name):
                        # Update headers list
                        self.headers.append(field_name)
                        print_info("Field added successfully!")
                    else:
                        print_error("Failed to add field!")
                else:
                    print_error("Invalid field name!")
            
            elif choice == '2':
                self.show_field_suggestions()
            
            elif choice == '3':
                self.show_current_fields()
            
            elif choice == '4':
                print_success("Add field session ended. Thank you!")
                break

def main():
    """Main entry point"""
    try:
        app = AddFieldApp()
        app.run()
    except Exception as e:
        print_error(f"Application error: {e}")

if __name__ == "__main__":
    main()

