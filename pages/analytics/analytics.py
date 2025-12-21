#!/usr/bin/env python3
"""
DieCastTracker - Analytics Page Utilities
Utility functions for analytics page operations
"""

import os
import sys
from collections import Counter

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils.backup_utils import create_backup

# Path to the Excel file
EXCEL_FILE_PATH = os.path.join("data", "HW_list.xlsx")

def load_excel_data():
    """Load data from the Excel file"""
    try:
        if os.path.exists(EXCEL_FILE_PATH):
            import pandas as pd
            df = pd.read_excel(EXCEL_FILE_PATH)
            df = df.fillna("")
            return df
        else:
            return None
    except Exception as e:
        raise Exception(f"Error loading Excel file: {str(e)}")

def get_collection_statistics():
    """Get comprehensive collection statistics"""
    try:
        df = load_excel_data()
        if df is None or df.empty:
            return {
                "total_models": 0,
                "series_breakdown": {},
                "main_series_breakdown": {},
                "recent_additions": [],
                "collection_goals": {},
                "collection_insights": {}
            }
        
        # Basic statistics
        total_models = len(df)
        
        # Series breakdown (by subseries)
        series_column = 'Series' if 'Series' in df.columns else df.columns[2] if len(df.columns) > 2 else None
        series_breakdown = {}
        main_series_breakdown = {}
        
        if series_column:
            series_counts = df[series_column].value_counts()
            series_breakdown = series_counts.to_dict()
            
            # Group by main series categories
            series_management_path = os.path.join(os.path.dirname(__file__), '..', 'series-management')
            sys.path.insert(0, series_management_path)
            from series_config import find_main_series_for_subseries
            
            for subseries, count in series_counts.items():
                main_series = find_main_series_for_subseries(subseries) if subseries else None
                if main_series:
                    main_series_breakdown[main_series] = main_series_breakdown.get(main_series, 0) + count
                else:
                    main_series_breakdown["Others"] = main_series_breakdown.get("Others", 0) + count
        
        # Recent additions (last 10) - reversed so newest shows first
        recent_additions = df.tail(10).to_dict('records')
        recent_additions.reverse()
        
        # Add main series information to each recent addition
        if series_column:
            series_management_path = os.path.join(os.path.dirname(__file__), '..', 'series-management')
            sys.path.insert(0, series_management_path)
            from series_config import find_main_series_for_subseries
            for item in recent_additions:
                subseries = item.get('Series', '')
                if subseries:
                    main_series = find_main_series_for_subseries(subseries)
                    item['Main Series'] = main_series if main_series else 'Others'
                else:
                    item['Main Series'] = 'Others'
        
        # Collection goals
        milestones = [10, 25, 50, 100, 250, 500, 1000]
        next_milestone = None
        for milestone in milestones:
            if total_models < milestone:
                next_milestone = milestone
                break
        
        collection_goals = {
            "current_count": total_models,
            "next_milestone": next_milestone,
            "progress_percentage": (total_models / next_milestone * 100) if next_milestone else 100
        }
        
        # Collection insights
        collection_insights = {}
        
        # Top series (most collected)
        if main_series_breakdown:
            top_series = sorted(main_series_breakdown.items(), key=lambda x: x[1], reverse=True)
            collection_insights["top_series"] = dict(top_series[:3])
        
        # Collection diversity
        if main_series_breakdown and len(main_series_breakdown) > 0:
            max_count = max(main_series_breakdown.values())
            min_count = min(main_series_breakdown.values())
            if max_count > 0:
                diversity = (1 - (max_count - min_count) / max_count) * 100 if max_count > min_count else 100
                collection_insights["diversity_score"] = round(diversity, 1)
            else:
                collection_insights["diversity_score"] = 0
        
        # Most popular subseries (top 5)
        if series_breakdown:
            top_subseries = sorted(series_breakdown.items(), key=lambda x: x[1], reverse=True)
            collection_insights["top_subseries"] = dict(top_subseries[:5])
        
        # Series coverage
        if main_series_breakdown:
            series_management_path = os.path.join(os.path.dirname(__file__), '..', 'series-management')
            sys.path.insert(0, series_management_path)
            from series_config import get_all_series
            all_main_series = get_all_series()
            covered_series = len(main_series_breakdown)
            total_possible_series = len(all_main_series)
            collection_insights["series_coverage"] = {
                "covered": covered_series,
                "total": total_possible_series,
                "percentage": round((covered_series / total_possible_series * 100) if total_possible_series > 0 else 0, 1)
            }
        
        # Model name insights (common words only)
        model_column = 'Model Name' if 'Model Name' in df.columns else df.columns[1] if len(df.columns) > 1 else None
        if model_column:
            model_names = df[model_column].dropna().astype(str)
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'series'}
            all_words = []
            for name in model_names:
                words = [w.lower().strip('.,!?()[]{}') for w in name.split() if len(w) > 2 and w.lower() not in stop_words]
                all_words.extend(words)
            word_counts = Counter(all_words)
            collection_insights["common_words"] = dict(word_counts.most_common(8))
        
        return {
            "total_models": total_models,
            "series_breakdown": series_breakdown,
            "main_series_breakdown": main_series_breakdown,
            "recent_additions": recent_additions,
            "collection_goals": collection_goals,
            "collection_insights": collection_insights
        }
    except Exception as e:
        raise Exception(f"Error getting statistics: {str(e)}")
