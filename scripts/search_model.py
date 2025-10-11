#!/usr/bin/env python3
"""
DieCastTracker - Search Model Script
Search through the Hot Wheels collection with improved functionality
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scripts.cli_utils import (
    ExcelManager, DisplayUtils, InputUtils, SearchUtils,
    print_success, print_error, print_info, print_warning
)

class SearchModelApp:
    """Application class for searching models"""
    
    def __init__(self):
        self.excel_manager = ExcelManager()
        self.wb, self.ws, self.headers, self.data = self.excel_manager.load_workbook_data()
        
        if self.wb is None:
            print_error("Cannot load Excel file. Exiting.")
            sys.exit(1)
    
    def display_search_results(self, matches: list, search_term: str):
        """Display search results in a formatted table"""
        if not matches:
            print_warning(f"No matching entries found for '{search_term}'.")
            return
        
        print_success(f"Found {len(matches)} matching result(s) for '{search_term}':")
        DisplayUtils.print_section("", 50)
        
        # Display results in table format
        DisplayUtils.display_models_table([match[1] for match in matches], self.headers, "Search Results")
    
    def advanced_search(self, search_term: str):
        """Perform advanced search with multiple criteria"""
        print_info("Advanced search options:")
        print("1. Search in Model Names only")
        print("2. Search in Series only")
        print("3. Search in all fields")
        print("4. Exact match only")
        
        choice = InputUtils.get_choice("Select search type (1-4): ", ['1', '2', '3', '4'])
        
        matches = []
        search_lower = search_term.lower()
        
        for i, row in enumerate(self.data):
            if choice == '1':  # Model names only
                if search_lower in str(row[1]).lower():
                    matches.append((i, row))
            elif choice == '2':  # Series only
                if len(row) > 2 and search_lower in str(row[2]).lower():
                    matches.append((i, row))
            elif choice == '3':  # All fields
                if any(search_lower in str(cell).lower() for cell in row):
                    matches.append((i, row))
            elif choice == '4':  # Exact match
                if any(search_lower == str(cell).lower() for cell in row):
                    matches.append((i, row))
        
        return matches
    
    def search_by_serial(self, serial_no: int):
        """Search for a specific model by serial number"""
        row_index, model_data = SearchUtils.find_model_by_serial(self.data, serial_no)
        
        if row_index is not None:
            print_success(f"Found model with serial number {serial_no}:")
            DisplayUtils.display_models_table([model_data], self.headers, "Model Details")
            return True
        else:
            print_error(f"No model found with serial number {serial_no}.")
            return False
    
    def show_collection_summary(self):
        """Show a summary of the entire collection"""
        if not self.data:
            print_warning("Collection is empty!")
            return
        
        print_info(f"Collection Summary: {len(self.data)} total models")
        DisplayUtils.display_models_table(self.data, self.headers, "Complete Collection")
    
    def run(self):
        """Main application loop"""
        DisplayUtils.print_header("🔍 HOT WHEELS MODEL SEARCH", 50)
        print_info("Search through your Hot Wheels collection.")
        print_info("Type 'exit' to quit, 'all' to see all models, 'help' for options.")
        
        while True:
            try:
                search_input = input("\nEnter search term (or command): ").strip()
                
                if search_input.lower() == 'exit':
                    break
                elif search_input.lower() == 'all':
                    self.show_collection_summary()
                    continue
                elif search_input.lower() == 'help':
                    self.show_help()
                    continue
                elif not search_input:
                    print_warning("Search term cannot be empty!")
                    continue
                
                # Check if input is a serial number
                if search_input.isdigit():
                    serial_no = int(search_input)
                    self.search_by_serial(serial_no)
                    continue
                
                # Check for advanced search command
                if search_input.startswith('adv:'):
                    search_term = search_input[4:].strip()
                    if search_term:
                        matches = self.advanced_search(search_term)
                        self.display_search_results(matches, search_term)
                    else:
                        print_warning("Advanced search requires a search term!")
                    continue
                
                # Regular search
                matches = SearchUtils.search_models(self.data, search_input)
                self.display_search_results(matches, search_input)
                
            except KeyboardInterrupt:
                print_info("\nSearch cancelled by user.")
                break
            except Exception as e:
                print_error(f"Search error: {e}")
                continue
        
        print_success("Search session ended. Thank you!")
    
    def show_help(self):
        """Show help information"""
        DisplayUtils.print_header("🔍 SEARCH HELP", 40)
        print("Search Commands:")
        print("  • Enter any text to search model names and series")
        print("  • Enter a number to search by serial number")
        print("  • Type 'all' to display all models")
        print("  • Type 'adv:term' for advanced search options")
        print("  • Type 'exit' to quit")
        print("  • Type 'help' to show this help")
        print()
        print("Examples:")
        print("  • 'Ferrari' - finds all Ferrari models")
        print("  • '123' - finds model with serial number 123")
        print("  • 'adv:BMW' - advanced search for BMW")
        print("=" * 40)

def main():
    """Main entry point"""
    try:
        app = SearchModelApp()
        app.run()
    except Exception as e:
        print_error(f"Application error: {e}")

if __name__ == "__main__":
    main()
