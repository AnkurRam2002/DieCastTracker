#!/usr/bin/env python3
"""
DieCastTracker - Statistics Script
Generate comprehensive statistics and insights for the Hot Wheels collection
"""

import os
import sys
from collections import Counter
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from scripts.cli_utils import (
    ExcelManager, DisplayUtils, InputUtils,
    print_success, print_error, print_info, print_warning
)

class StatisticsApp:
    """Application class for generating collection statistics"""
    
    def __init__(self):
        self.excel_manager = ExcelManager()
        self.wb, self.ws, self.headers, self.data = self.excel_manager.load_workbook_data()
        
        if self.wb is None:
            print_error("Cannot load Excel file. Exiting.")
            sys.exit(1)
    
    def display_basic_stats(self):
        """Display basic collection statistics"""
        DisplayUtils.print_header("📊 COLLECTION STATISTICS", 50)
        
        total_cars = len(self.data)
        print(f"🚗 Total Cars in Collection: {total_cars}")
        
        if total_cars == 0:
            print_warning("Collection is empty!")
            return
        
        # Series breakdown
        if len(self.headers) >= 3:  # Assuming S.No, Model Name, Series columns
            series_column = 2  # Series is 3rd column (index 2)
            series_counts = Counter(row[series_column] for row in self.data if row[series_column])
            
            print(f"\n📈 Series Breakdown:")
            DisplayUtils.print_section("", 30)
            for series, count in series_counts.most_common():
                percentage = (count / total_cars) * 100 if total_cars > 0 else 0
                print(f"  {series}: {count} cars ({percentage:.1f}%)")
        
        print("=" * 50)

    def display_detailed_stats(self):
        """Display detailed statistics with more insights"""
        DisplayUtils.print_header("🔍 DETAILED ANALYSIS", 50)
        
        total_cars = len(self.data)
        
        if total_cars == 0:
            print_warning("No cars in collection yet!")
            return
        
        # Series analysis
        if len(self.headers) >= 3:
            series_column = 2
            series_counts = Counter(row[series_column] for row in self.data if row[series_column])
            
            if series_counts:
                print(f"📊 Series Analysis:")
                print(f"  • Most Popular Series: {series_counts.most_common(1)[0][0]} ({series_counts.most_common(1)[0][1]} cars)")
                print(f"  • Least Popular Series: {series_counts.most_common()[-1][0]} ({series_counts.most_common()[-1][1]} cars)")
                print(f"  • Total Unique Series: {len(series_counts)}")
                
                # Series diversity
                if len(series_counts) > 1:
                    diversity = len(series_counts) / total_cars * 100
                    print(f"  • Series Diversity: {diversity:.1f}% (higher = more variety)")
        
        # Model name analysis
        if len(self.headers) >= 2:
            model_column = 1
            model_names = [row[model_column] for row in self.data if row[model_column]]
            
            if model_names:
                # Find common words in model names
                all_words = []
                for name in model_names:
                    if isinstance(name, str):
                        all_words.extend(name.lower().split())
                
                word_counts = Counter(all_words)
                common_words = word_counts.most_common(5)
                
                print(f"\n🏷️  Model Name Insights:")
                if common_words:
                    print(f"  • Most Common Words: {', '.join([word for word, count in common_words])}")
                
                # Average model name length
                avg_length = sum(len(str(name)) for name in model_names) / len(model_names)
                print(f"  • Average Model Name Length: {avg_length:.1f} characters")
        
        print("=" * 50)

    def display_recent_additions(self, limit=5):
        """Display recent additions to the collection"""
        DisplayUtils.print_header(f"🆕 RECENT ADDITIONS (Last {limit})", 50)
        
        if len(self.data) == 0:
            print_warning("No cars in collection yet!")
            return
        
        # Show the last N entries
        recent_cars = self.data[-limit:] if len(self.data) >= limit else self.data
        
        for i, car in enumerate(recent_cars, 1):
            serial_no = car[0] if len(car) > 0 else "N/A"
            model_name = car[1] if len(car) > 1 else "N/A"
            series = car[2] if len(car) > 2 else "N/A"
            print(f"  {i}. S.No: {serial_no} | {model_name} | {series}")
        
        print("=" * 50)

    def display_collection_goals(self):
        """Display collection goals and progress"""
        DisplayUtils.print_header("🎯 COLLECTION GOALS", 50)
        
        total_cars = len(self.data)
        
        # Milestone goals
        milestones = [10, 25, 50, 100, 250, 500, 1000]
        next_milestone = None
        
        for milestone in milestones:
            if total_cars < milestone:
                next_milestone = milestone
                break
        
        if next_milestone:
            remaining = next_milestone - total_cars
            print(f"🎯 Next Milestone: {next_milestone} cars")
            print(f"📈 Cars needed: {remaining}")
            print(f"📊 Progress: {(total_cars/next_milestone)*100:.1f}%")
        else:
            print(f"🏆 Congratulations! You've exceeded all standard milestones!")
            print(f"🚀 You have {total_cars} cars - that's an amazing collection!")
        
        print("=" * 50)

    def create_simple_chart(self, series_counts):
        """Create a simple text-based chart"""
        if not series_counts:
            return
        
        DisplayUtils.print_header("📊 SERIES DISTRIBUTION CHART", 50)
        
        max_count = max(series_counts.values())
        max_bar_length = 30
        
        for series, count in series_counts.most_common():
            bar_length = int((count / max_count) * max_bar_length)
            bar = "█" * bar_length
            print(f"{series:<25} │{bar} {count}")
        
        print("=" * 50)
    
    def show_interactive_menu(self):
        """Show interactive statistics menu"""
        while True:
            DisplayUtils.print_section("📊 STATISTICS MENU")
            print("1. Basic Statistics")
            print("2. Detailed Analysis")
            print("3. Recent Additions")
            print("4. Collection Goals")
            print("5. Series Distribution Chart")
            print("6. Complete Report")
            print("7. Exit")
            
            choice = InputUtils.get_choice("Select option (1-7): ", [str(i) for i in range(1, 8)])
            
            if choice == '1':
                self.display_basic_stats()
            elif choice == '2':
                self.display_detailed_stats()
            elif choice == '3':
                limit = InputUtils.get_serial_number("How many recent additions to show (default 5): ") or 5
                self.display_recent_additions(limit)
            elif choice == '4':
                self.display_collection_goals()
            elif choice == '5':
                if len(self.headers) >= 3 and self.data:
                    series_column = 2
                    series_counts = Counter(row[series_column] for row in self.data if row[series_column])
                    self.create_simple_chart(series_counts)
                else:
                    print_warning("No series data available for chart!")
            elif choice == '6':
                self.generate_complete_report()
            elif choice == '7':
                break
            
            if choice != '7':
                input("\nPress Enter to continue...")
                print("\n" + "="*60 + "\n")

    def generate_complete_report(self):
        """Generate a complete statistics report"""
        DisplayUtils.print_header("📊 COMPLETE COLLECTION REPORT", 60)
        
        self.display_basic_stats()
        self.display_detailed_stats()
        self.display_recent_additions()
        self.display_collection_goals()
        
        # Create visual chart if we have series data
        if len(self.headers) >= 3 and self.data:
            series_column = 2
            series_counts = Counter(row[series_column] for row in self.data if row[series_column])
            self.create_simple_chart(series_counts)
        
        print(f"\n✅ Report generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

    def run(self):
        """Main application loop"""
        DisplayUtils.print_header("🔍 HOT WHEELS COLLECTION STATISTICS", 60)
        
        if not self.data:
            print_warning("Collection is empty! Add some models first.")
            return
        
        print_info("Choose how you'd like to view your collection statistics:")
        print("1. Interactive menu (recommended)")
        print("2. Complete report")
        
        choice = InputUtils.get_choice("Select option (1-2): ", ['1', '2'])
        
        if choice == '1':
            self.show_interactive_menu()
        else:
            self.generate_complete_report()

def main():
    """Main entry point"""
    try:
        app = StatisticsApp()
        app.run()
    except Exception as e:
        print_error(f"Application error: {e}")

if __name__ == "__main__":
    main()
