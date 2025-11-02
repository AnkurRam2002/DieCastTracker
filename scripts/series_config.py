#!/usr/bin/env python3
"""
DieCastTracker - Series Configuration
Centralized configuration for Hot Wheels series and subseries options
"""

# Series options as a nested dictionary
SERIES_OPTIONS = {'Mainlines': ['Mainlines', '54th Anniversary Series', '57th Anniversary Series', '53rd Anniversary Series'], 'Silver Series': ['Ultra Hots', 'Silver Series BMW', 'Silver Series Fast & Furious Villains', 'Silver Series National Icons', 'Luxury Sedans', 'HW Speed Graphics', 'Neon Speeders', '1/4 Mile Finals Series', 'Fast & Furious Hobbs & Shaw', 'Transformers', 'Exotics'], 'Premiums': ['Premiums Pop Culture', 'Premiums Boulevard', 'Premiums Fast & Furious', 'Premiums Car Culture'], 'Others': ['Track Fleet', 'Color Shifters']}

# Series metadata for additional information
SERIES_METADATA = {'Mainlines': {'description': 'Basic Hot Wheels cars available in most stores', 'price_range': '₹180', 'rarity': 'Common'}, 'Silver Series': {'description': 'Mid-tier cars with better details and packaging', 'price_range': '₹300', 'rarity': 'Uncommon'}, 'Premiums': {'description': 'High-quality cars with premium details and packaging', 'price_range': '₹550', 'rarity': 'Rare'}, 'Others': {'description': 'Special categories and track sets', 'price_range': 'Varies', 'rarity': 'Varies'}}

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
    return SERIES_METADATA.get(main_series, {})

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
    print(f"Main Series Categories: {main_count}")
    print(f"Total Subseries: {sub_count}")
    print()
    
    for main_series, subseries_list in SERIES_OPTIONS.items():
        metadata = get_series_info(main_series)
        print(f"🏷️  {main_series} ({len(subseries_list)} subseries)")
        if metadata:
            print(f"   Description: {metadata.get('description', 'N/A')}")
            print(f"   Price Range: {metadata.get('price_range', 'N/A')}")
            print(f"   Rarity: {metadata.get('rarity', 'N/A')}")
        print(f"   Subseries: {', '.join(subseries_list)}")
        print()

if __name__ == "__main__":
    # Test the configuration
    print_series_summary()
    
    # Test some functions
    print("🔍 TESTING FUNCTIONS:")
    print(f"All main series: {get_all_series()}")
    print(f"Mainlines subseries: {get_subseries('Mainlines')}")
    print(f"Total series count: {get_series_count()}")
    print(f"Find main series for 'Ultra Hots': {find_main_series_for_subseries('Ultra Hots')}")
    print(f"Validate 'Mainlines' + 'Mainlines': {validate_series_combination('Mainlines', 'Mainlines')}")
