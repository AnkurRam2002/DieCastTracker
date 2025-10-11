#!/usr/bin/env python3
"""
DieCastTracker - Series Management Script
Manage Hot Wheels series and subseries configuration
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scripts.series_config import (
    SERIES_OPTIONS, SERIES_METADATA, get_all_series, get_subseries,
    get_series_info, validate_series_combination, print_series_summary
)
from scripts.cli_utils import (
    DisplayUtils, InputUtils,
    print_success, print_error, print_info, print_warning
)

class SeriesManager:
    """Manager for series configuration"""
    
    def __init__(self):
        self.series_options = SERIES_OPTIONS.copy()
        self.series_metadata = SERIES_METADATA.copy()
    
    def show_current_series(self):
        """Display current series configuration"""
        print_series_summary()
    
    def add_main_series(self):
        """Add a new main series category"""
        print_info("Adding a new main series category...")
        
        series_name = input("Enter the name of the new main series: ").strip()
        if not series_name:
            print_error("Series name cannot be empty!")
            return
        
        if series_name in self.series_options:
            print_warning(f"Series '{series_name}' already exists!")
            return
        
        # Add the new series
        self.series_options[series_name] = []
        
        # Add metadata
        description = input("Enter description (optional): ").strip()
        price_range = input("Enter price range (optional): ").strip()
        rarity = input("Enter rarity level (optional): ").strip()
        
        self.series_metadata[series_name] = {
            "description": description or "No description available",
            "price_range": price_range or "Varies",
            "rarity": rarity or "Unknown"
        }
        
        print_success(f"Main series '{series_name}' added successfully!")
        print_info("Don't forget to add subseries to this category.")
    
    def add_subseries(self):
        """Add a new subseries to an existing main series"""
        print_info("Adding a new subseries...")
        
        # Show current main series
        main_series_list = list(self.series_options.keys())
        if not main_series_list:
            print_error("No main series available! Add a main series first.")
            return
        
        print("Available main series:")
        for i, series in enumerate(main_series_list, 1):
            print(f"  {i}. {series}")
        
        try:
            choice = int(input("Select main series (number): ")) - 1
            if 0 <= choice < len(main_series_list):
                main_series = main_series_list[choice]
            else:
                print_error("Invalid selection!")
                return
        except ValueError:
            print_error("Please enter a valid number!")
            return
        
        subseries_name = input(f"Enter the name of the new subseries for '{main_series}': ").strip()
        if not subseries_name:
            print_error("Subseries name cannot be empty!")
            return
        
        if subseries_name in self.series_options[main_series]:
            print_warning(f"Subseries '{subseries_name}' already exists in '{main_series}'!")
            return
        
        # Add the subseries
        self.series_options[main_series].append(subseries_name)
        print_success(f"Subseries '{subseries_name}' added to '{main_series}' successfully!")
    
    def remove_subseries(self):
        """Remove a subseries from a main series"""
        print_info("Removing a subseries...")
        
        # Find all subseries with their main series
        all_subseries = []
        for main_series, subseries_list in self.series_options.items():
            for subseries in subseries_list:
                all_subseries.append((main_series, subseries))
        
        if not all_subseries:
            print_error("No subseries available to remove!")
            return
        
        print("Available subseries:")
        for i, (main_series, subseries) in enumerate(all_subseries, 1):
            print(f"  {i}. {subseries} (in {main_series})")
        
        try:
            choice = int(input("Select subseries to remove (number): ")) - 1
            if 0 <= choice < len(all_subseries):
                main_series, subseries = all_subseries[choice]
            else:
                print_error("Invalid selection!")
                return
        except ValueError:
            print_error("Please enter a valid number!")
            return
        
        if InputUtils.confirm_action(f"Remove '{subseries}' from '{main_series}'?"):
            self.series_options[main_series].remove(subseries)
            print_success(f"Subseries '{subseries}' removed from '{main_series}' successfully!")
        else:
            print_info("Removal cancelled.")
    
    def edit_series_metadata(self):
        """Edit metadata for a main series"""
        print_info("Editing series metadata...")
        
        main_series_list = list(self.series_options.keys())
        if not main_series_list:
            print_error("No main series available!")
            return
        
        print("Available main series:")
        for i, series in enumerate(main_series_list, 1):
            print(f"  {i}. {series}")
        
        try:
            choice = int(input("Select main series to edit (number): ")) - 1
            if 0 <= choice < len(main_series_list):
                main_series = main_series_list[choice]
            else:
                print_error("Invalid selection!")
                return
        except ValueError:
            print_error("Please enter a valid number!")
            return
        
        # Show current metadata
        current_metadata = self.series_metadata.get(main_series, {})
        print(f"\nCurrent metadata for '{main_series}':")
        print(f"  Description: {current_metadata.get('description', 'N/A')}")
        print(f"  Price Range: {current_metadata.get('price_range', 'N/A')}")
        print(f"  Rarity: {current_metadata.get('rarity', 'N/A')}")
        
        # Get new values
        new_description = input("Enter new description (press Enter to keep current): ").strip()
        new_price_range = input("Enter new price range (press Enter to keep current): ").strip()
        new_rarity = input("Enter new rarity (press Enter to keep current): ").strip()
        
        # Update metadata
        if new_description:
            current_metadata['description'] = new_description
        if new_price_range:
            current_metadata['price_range'] = new_price_range
        if new_rarity:
            current_metadata['rarity'] = new_rarity
        
        self.series_metadata[main_series] = current_metadata
        print_success(f"Metadata updated for '{main_series}' successfully!")
    
    def export_configuration(self):
        """Export current configuration to a file"""
        print_info("Exporting configuration...")
        
        config_content = f'''#!/usr/bin/env python3
"""
DieCastTracker - Series Configuration
Centralized configuration for Hot Wheels series and subseries options
"""

# Series options as a nested dictionary
SERIES_OPTIONS = {self.series_options}

# Series metadata for additional information
SERIES_METADATA = {self.series_metadata}

def get_all_series():
    """Get all main series categories"""
    return list(SERIES_OPTIONS.keys())

def get_subseries(main_series):
    """Get subseries for a specific main series"""
    return SERIES_OPTIONS.get(main_series, [])

def get_all_subseries():
    """Get all subseries as a flat list"""
    all_subseries = []
    for subseries_list in SERIES_OPTIONS.values():
        all_subseries.extend(subseries_list)
    return all_subseries

def get_series_info(main_series):
    """Get metadata information for a main series"""
    return SERIES_METADATA.get(main_series, {{}})

def find_main_series_for_subseries(subseries):
    """Find which main series a subseries belongs to"""
    for main_series, subseries_list in SERIES_OPTIONS.items():
        if subseries in subseries_list:
            return main_series
    return None

def validate_series_combination(main_series, subseries):
    """Validate if a main series and subseries combination is valid"""
    if main_series not in SERIES_OPTIONS:
        return False
    return subseries in SERIES_OPTIONS[main_series]

def get_series_count():
    """Get total count of series and subseries"""
    main_count = len(SERIES_OPTIONS)
    sub_count = sum(len(subseries_list) for subseries_list in SERIES_OPTIONS.values())
    return main_count, sub_count

def print_series_summary():
    """Print a summary of all series options"""
    print("📊 SERIES CONFIGURATION SUMMARY")
    print("=" * 50)
    
    main_count, sub_count = get_series_count()
    print(f"Main Series Categories: {{main_count}}")
    print(f"Total Subseries: {{sub_count}}")
    print()
    
    for main_series, subseries_list in SERIES_OPTIONS.items():
        metadata = get_series_info(main_series)
        print(f"🏷️  {{main_series}} ({{len(subseries_list)}} subseries)")
        if metadata:
            print(f"   Description: {{metadata.get('description', 'N/A')}}")
            print(f"   Price Range: {{metadata.get('price_range', 'N/A')}}")
            print(f"   Rarity: {{metadata.get('rarity', 'N/A')}}")
        print(f"   Subseries: {{', '.join(subseries_list)}}")
        print()

if __name__ == "__main__":
    # Test the configuration
    print_series_summary()
    
    # Test some functions
    print("🔍 TESTING FUNCTIONS:")
    print(f"All main series: {{get_all_series()}}")
    print(f"Mainlines subseries: {{get_subseries('Mainlines')}}")
    print(f"Total series count: {{get_series_count()}}")
    print(f"Find main series for 'Ultra Hots': {{find_main_series_for_subseries('Ultra Hots')}}")
    print(f"Validate 'Mainlines' + 'Mainlines': {{validate_series_combination('Mainlines', 'Mainlines')}}")
'''
        
        # Write to file
        config_file = os.path.join('scripts', 'series_config.py')
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                f.write(config_content)
            print_success(f"Configuration exported to {config_file}")
            print_warning("Remember to restart the application to use the new configuration!")
        except Exception as e:
            print_error(f"Failed to export configuration: {e}")
    
    def run(self):
        """Main application loop"""
        DisplayUtils.print_header("🔧 SERIES CONFIGURATION MANAGER", 50)
        print_info("Manage Hot Wheels series and subseries options")
        
        while True:
            DisplayUtils.print_section("📋 MANAGEMENT OPTIONS")
            print("1. View Current Series")
            print("2. Add Main Series")
            print("3. Add Subseries")
            print("4. Remove Subseries")
            print("5. Edit Series Metadata")
            print("6. Export Configuration")
            print("7. Exit")
            
            choice = InputUtils.get_choice("Enter your choice (1-7): ", [str(i) for i in range(1, 8)])
            
            if choice == '1':
                self.show_current_series()
            elif choice == '2':
                self.add_main_series()
            elif choice == '3':
                self.add_subseries()
            elif choice == '4':
                self.remove_subseries()
            elif choice == '5':
                self.edit_series_metadata()
            elif choice == '6':
                self.export_configuration()
            elif choice == '7':
                print_success("Series management session ended. Thank you!")
                break
            
            if choice != '7':
                input("\nPress Enter to continue...")
                print("\n" + "="*60 + "\n")

def main():
    """Main entry point"""
    try:
        manager = SeriesManager()
        manager.run()
    except Exception as e:
        print_error(f"Application error: {e}")

if __name__ == "__main__":
    main()
