#!/usr/bin/env python3
"""
DieCastTracker - Add Model Page Utilities
Utility functions for adding models to the collection
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils.backup_utils import create_backup
from openpyxl import load_workbook

# Path to the Excel file
EXCEL_FILE_PATH = os.path.join("data", "HW_list.xlsx")

# Import database utilities
from utils.database import SessionLocal, Car, Subseries

def add_model(model_name: str, series: str, subseries: str):
    """Add a new model to the Excel file"""
    try:
        # Create backup before adding (if file exists)
        if os.path.exists(EXCEL_FILE_PATH):
            if not create_backup(EXCEL_FILE_PATH):
                raise Exception("Failed to create backup")
        
        # Load existing workbook or create new one
        if os.path.exists(EXCEL_FILE_PATH):
            wb = load_workbook(EXCEL_FILE_PATH)
            ws = wb.active
            last_serial_number = ws.max_row
        else:
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            ws.append(["S.No", "Model Name", "Series"])
            last_serial_number = 1
        
        # Add new row (using subseries as the series field in Excel)
        ws.append([
            last_serial_number,
            model_name.strip(),
            subseries
        ])
        
        # Save workbook
        wb.save(EXCEL_FILE_PATH)
        
        # Database Insertion (Dual Write)
        try:
            db = SessionLocal()
            # Find subseries ID by name
            sub_obj = db.query(Subseries).filter(Subseries.name == subseries).first()
            sub_id = sub_obj.id if sub_obj else None
            
            if not sub_id and subseries:
                # If subseries doesn't exist, create it under the given series
                from utils.database import Series
                s_obj = db.query(Series).filter(Series.name == series).first()
                if not s_obj:
                    s_obj = Series(name=series)
                    db.add(s_obj)
                    db.flush()
                
                new_sub = Subseries(name=subseries, series_id=s_obj.id)
                db.add(new_sub)
                db.flush()
                sub_id = new_sub.id

            new_car = Car(
                serial_number=last_serial_number,
                model_name=model_name.strip(),
                subseries_id=sub_id
            )
            db.add(new_car)
            db.commit()
            db.close()
        except Exception as db_err:
            print(f"Database error (Excel saved): {db_err}")
            # We don't raise here to allow Excel-only operation if DB is down
        
        return {
            "success": True,
            "serial_number": last_serial_number,
            "message": f"Successfully added '{model_name}' to the collection!"
        }
    except Exception as e:
        raise Exception(f"Error adding model: {str(e)}")
