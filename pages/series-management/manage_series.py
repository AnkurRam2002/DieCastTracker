#!/usr/bin/env python3
"""
DieCastTracker - Series Management Page Utilities
Utility functions for managing series configuration
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
# Add current directory to path for same-folder imports
sys.path.insert(0, os.path.dirname(__file__))

# Import from same directory (series-management folder)
from series_config import (
    SERIES_OPTIONS, SERIES_METADATA, get_all_series, get_subseries,
    get_series_info, validate_series_combination
)

def get_series_config():
    """Get current series configuration"""
    return {
        "series_options": SERIES_OPTIONS,
        "series_metadata": SERIES_METADATA
    }

def add_series(series_name: str, description: str = None, price_range: str = None, rarity: str = None):
    """Add a new main series"""
    try:
        if series_name in SERIES_OPTIONS:
            raise Exception(f"Series '{series_name}' already exists")
        
        # Add the new series
        SERIES_OPTIONS[series_name] = []
        
        # Add metadata
        SERIES_METADATA[series_name] = {
            "description": description or "No description available",
            "price_range": price_range or "Varies",
            "rarity": rarity or "Unknown"
        }
        
        # Save to file
        save_series_config()
        
        return {
            "success": True,
            "message": f"Series '{series_name}' added successfully!"
        }
    except Exception as e:
        raise Exception(f"Error adding series: {str(e)}")

def add_subseries(main_series: str, subseries: str):
    """Add a subseries to a main series"""
    try:
        if main_series not in SERIES_OPTIONS:
            SERIES_OPTIONS[main_series] = []
        if subseries in SERIES_OPTIONS[main_series]:
            raise Exception(f"Subseries '{subseries}' already exists in '{main_series}'")
        
        SERIES_OPTIONS[main_series].append(subseries)
        save_series_config()
        
        return {
            "success": True,
            "message": f"Subseries '{subseries}' added to '{main_series}' successfully!"
        }
    except Exception as e:
        raise Exception(f"Error adding subseries: {str(e)}")

def remove_subseries(main_series: str, subseries: str):
    """Remove a subseries from a main series"""
    try:
        if main_series not in SERIES_OPTIONS:
            raise Exception(f"Series '{main_series}' not found")
        if subseries not in SERIES_OPTIONS[main_series]:
            raise Exception(f"Subseries '{subseries}' not found in '{main_series}'")
        
        SERIES_OPTIONS[main_series].remove(subseries)
        save_series_config()
        
        return {
            "success": True,
            "message": f"Subseries '{subseries}' removed from '{main_series}' successfully!"
        }
    except Exception as e:
        raise Exception(f"Error removing subseries: {str(e)}")

def rename_series(old_name: str, new_name: str):
    """Rename a main series"""
    try:
        if old_name not in SERIES_OPTIONS:
            raise Exception(f"Series '{old_name}' not found")
        if new_name in SERIES_OPTIONS:
            raise Exception(f"Series '{new_name}' already exists")
        
        # Rename the series
        subseries_list = SERIES_OPTIONS.pop(old_name)
        SERIES_OPTIONS[new_name] = subseries_list
        
        # Rename metadata if it exists
        if old_name in SERIES_METADATA:
            SERIES_METADATA[new_name] = SERIES_METADATA.pop(old_name)
        
        save_series_config()
        
        return {
            "success": True,
            "message": f"Series '{old_name}' renamed to '{new_name}' successfully!"
        }
    except Exception as e:
        raise Exception(f"Error renaming series: {str(e)}")

def rename_subseries(main_series: str, old_name: str, new_name: str):
    """Rename a subseries"""
    try:
        if main_series not in SERIES_OPTIONS:
            raise Exception(f"Series '{main_series}' not found")
        if old_name not in SERIES_OPTIONS[main_series]:
            raise Exception(f"Subseries '{old_name}' not found in '{main_series}'")
        if new_name in SERIES_OPTIONS[main_series]:
            raise Exception(f"Subseries '{new_name}' already exists in '{main_series}'")
        
        # Rename the subseries
        index = SERIES_OPTIONS[main_series].index(old_name)
        SERIES_OPTIONS[main_series][index] = new_name
        
        save_series_config()
        
        return {
            "success": True,
            "message": f"Subseries '{old_name}' renamed to '{new_name}' successfully!"
        }
    except Exception as e:
        raise Exception(f"Error renaming subseries: {str(e)}")

def save_series_config():
    """Save the current SERIES_OPTIONS and SERIES_METADATA to series_config.py file"""
    try:
        # Path to the series config file
        config_path = os.path.join(os.path.dirname(__file__), "series_config.py")
        
        # Format the dictionaries for Python code
        series_options_items = []
        for series, subseries_list in SERIES_OPTIONS.items():
            subseries_repr = [repr(sub) for sub in subseries_list]
            series_options_items.append(f"{repr(series)}: [{', '.join(subseries_repr)}]")
        series_options_str = "{" + ", ".join(series_options_items) + "}"
        
        series_metadata_items = []
        for series, metadata in SERIES_METADATA.items():
            desc = repr(metadata.get('description', 'No description available'))
            price = repr(metadata.get('price_range', 'Varies'))
            rarity = repr(metadata.get('rarity', 'Unknown'))
            series_metadata_items.append(f"{repr(series)}: {{'description': {desc}, 'price_range': {price}, 'rarity': {rarity}}}")
        series_metadata_str = "{" + ", ".join(series_metadata_items) + "}"
        
        # Generate the complete file content
        config_content = f'''#!/usr/bin/env python3
"""
DieCastTracker - Series Configuration
Centralized configuration for Hot Wheels series and subseries options
"""

# Series options as a nested dictionary
SERIES_OPTIONS = {series_options_str}

# Series metadata for additional information
SERIES_METADATA = {series_metadata_str}

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
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        return True
    except Exception as e:
        raise Exception(f"Error saving series config: {str(e)}")
