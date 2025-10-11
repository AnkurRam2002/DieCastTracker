#!/usr/bin/env python3
"""
DieCastTracker - Add Model Script
Add new models to the Hot Wheels collection with improved user experience
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scripts.cli_utils import (
    ExcelManager, DisplayUtils, InputUtils, ModelUtils, 
    print_success, print_error, print_info, print_warning
)

class AddModelApp:
    """Application class for adding new models"""
    
    def __init__(self):
        self.excel_manager = ExcelManager()
        self.setup_workbook()
    
    def setup_workbook(self):
        """Setup workbook and get initial serial number"""
        wb, ws, headers, data = self.excel_manager.load_workbook_data()
        
        if wb is None:
            # Create new workbook
            wb, ws = self.excel_manager.create_new_workbook()
            self.last_serial_number = 1
            print_info("Created new Excel file with default headers.")
        else:
            self.last_serial_number = len(data) + 1
            print_success(f"Excel file loaded. Continuing from serial number {self.last_serial_number}.")
        
        self.wb = wb
        self.ws = ws

    def add_model(self, model_name: str, series: str, subseries: str):
        """Add a new model to the workbook"""
        self.ws.append([self.last_serial_number, model_name.strip(), subseries])
        self.last_serial_number += 1
        print_success(f"Added '{model_name}' to collection (S.No: {self.last_serial_number - 1})")
    
    def process_model_input(self, model_input: str):
        """Process model input and return model details"""
        # Parse shortcut input if present
        model_name, main_series, subseries = ModelUtils.parse_shortcut_input(model_input)
        
        if main_series and subseries:
            # Shortcut was successfully parsed
            return model_name, main_series, subseries
        else:
            # Manual selection required
            main_series, subseries = ModelUtils.get_series_selection()
            return model_name, main_series, subseries
    
    def run(self):
        """Main application loop"""
        DisplayUtils.print_header("🆕 ADD NEW MODELS", 50)
        print_info("Enter model names one by one. Type 'exit' to finish.")
        print_info("Use shortcuts like 'Car Name#13' for quick series selection.")
        
        models_added = 0
        
        while True:
            try:
                model_input = input(f"\nEnter Model Name {self.last_serial_number} (or type 'exit' to finish): ").strip()
                
                if model_input.lower() == 'exit':
                    break
                
                if not model_input:
                    print_warning("Model name cannot be empty!")
                    continue
                
                # Process the input
                model_name, main_series, subseries = self.process_model_input(model_input)
                
                if not model_name:
                    print_error("Invalid model name!")
                    continue
                
                # Add the model
                self.add_model(model_name, main_series, subseries)
                models_added += 1
                
            except KeyboardInterrupt:
                print_info("\nOperation cancelled by user.")
                break
            except Exception as e:
                print_error(f"Error processing model: {e}")
                continue
        
        # Save the file
        if models_added > 0:
            if self.excel_manager.save_workbook(self.wb):
                print_success(f"All {models_added} model(s) saved to Excel file!")
            else:
                print_error("Failed to save Excel file!")
        else:
            print_info("No models were added.")

def main():
    """Main entry point"""
    try:
        app = AddModelApp()
        app.run()
    except Exception as e:
        print_error(f"Application error: {e}")

if __name__ == "__main__":
    main()



