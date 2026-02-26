#!/usr/bin/env python3
"""
DieCastTracker - Data Synchronization Script (Relational)
Migrate data from Excel and Config files to relational PostgreSQL/SQLite
"""

import os
import sys
import pandas as pd
from sqlalchemy.orm import Session
from datetime import datetime

# Add root and series-management directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'pages', 'series-management'))
from utils.database import SessionLocal, Series, Subseries, Car, Preorder, init_db
from series_config import SERIES_OPTIONS, SERIES_METADATA

# Paths to Excel files
EXCEL_FILE_PATH = os.path.join("data", "HW_list.xlsx")
PREORDERS_FILE_PATH = os.path.join("data", "preorders.xlsx")

def sync_series_and_subseries(db: Session):
    """Seed Series and Subseries from series_config.py if empty"""
    print("Syncing Series and Subseries categories...")
    
    # Check if data already exists
    if db.query(Series).count() > 0:
        print("Series already exist in database. Skipping category sync.")
        # Return a map of subseries name -> id for the cars sync (if it runs)
        return {s.name: s.id for s in db.query(Subseries).all()}

    # Clear existing categories (only hits if count was 0 or during first run)
    db.query(Subseries).delete()
    db.query(Series).delete()
    db.commit()

    series_map = {} # name -> id
    subseries_map = {} # name -> id

    # 1. Sync Series
    for series_name, metadata in SERIES_METADATA.items():
        new_series = Series(
            name=series_name,
            description=metadata.get("description"),
            price_range=metadata.get("price_range"),
            rarity=metadata.get("rarity")
        )
        db.add(new_series)
        db.flush() # Get ID
        series_map[series_name] = new_series.id

    # 2. Sync Subseries
    for series_name, sub_list in SERIES_OPTIONS.items():
        series_id = series_map.get(series_name)
        if not series_id:
            # Create Series if not in metadata but in options
            new_series = Series(name=series_name)
            db.add(new_series)
            db.flush()
            series_id = new_series.id
            series_map[series_name] = series_id

        for sub_name in sub_list:
            new_sub = Subseries(name=sub_name, series_id=series_id)
            db.add(new_sub)
            db.flush()
            subseries_map[sub_name] = new_sub.id

    db.commit()
    return subseries_map

def sync_cars(db: Session, subseries_map: dict):
    """Sync cars from HW_list.xlsx to the database if the database is empty"""
    if not os.path.exists(EXCEL_FILE_PATH):
        print(f"Skipping cars sync: {EXCEL_FILE_PATH} not found")
        return

    # Check if data already exists
    existing_count = db.query(Car).count()
    if existing_count > 0:
        print(f"Database already contains {existing_count} cars. Skipping sync to prevent overwriting cloud data.")
        return

    print("Syncing cars from Excel...")
    df = pd.read_excel(EXCEL_FILE_PATH)
    df = df.fillna("")
    
    for _, row in df.iterrows():
        # ... logic remains same ...
        sub_name = str(row.get("Series", "")).strip()
        sub_id = subseries_map.get(sub_name)
        
        if not sub_id and sub_name:
            # Handle cases where subseries exists in Excel but not in config
            # (Though it should be in config in a perfect world)
            # Find which series it might belong to or use 'Others'
            from pages.series_management.series_config import find_main_series_for_subseries
            main_series = find_main_series_for_subseries(sub_name) or "Others"
            
            # Check if Subseries exists now (might have been added in this loop)
            existing_sub = db.query(Subseries).filter(Subseries.name == sub_name).first()
            if not existing_sub:
                # Find series ID
                s = db.query(Series).filter(Series.name == main_series).first()
                if not s:
                    s = Series(name=main_series)
                    db.add(s)
                    db.flush()
                
                new_sub = Subseries(name=sub_name, series_id=s.id)
                db.add(new_sub)
                db.flush()
                sub_id = new_sub.id
                subseries_map[sub_name] = sub_id
            else:
                sub_id = existing_sub.id

        car = Car(
            serial_number=int(row.get("S.No", 0)),
            model_name=str(row.get("Model Name", "")).strip(),
            subseries_id=sub_id
        )
        db.add(car)
    
    db.commit()
    print(f"Successfully synced {len(df)} cars.")

def sync_preorders(db: Session):
    """Sync preorders from preorders.xlsx to the database if empty"""
    if not os.path.exists(PREORDERS_FILE_PATH):
        print(f"Skipping preorders sync: {PREORDERS_FILE_PATH} not found")
        return

    # Check if data already exists
    existing_count = db.query(Preorder).count()
    if existing_count > 0:
        print(f"Database already contains {existing_count} preorders. Skipping sync.")
        return

    print("Syncing preorders from Excel...")
    df = pd.read_excel(PREORDERS_FILE_PATH)
    df = df.fillna("")
    
    for _, row in df.iterrows():
        def safe_float(val):
            try:
                if val == "" or pd.isna(val): return None
                return float(val)
            except:
                return None

        preorder = Preorder(
            serial_number=int(row.get("S.No", 0)),
            seller=str(row.get("Seller", "")).strip(),
            models=str(row.get("Models", "")).strip(),
            eta=str(row.get("ETA", "")).strip(),
            total_price=safe_float(row.get("Total Price")),
            po_amount=safe_float(row.get("PO Amount")),
            on_arrival_amount=safe_float(row.get("On Arrival Amount")),
            delivery_status=str(row.get("Delivery Status", "Pending")).strip(),
            date_added=str(row.get("Date Added", datetime.now().strftime("%Y-%m-%d"))).strip()
        )
        db.add(preorder)
    
    db.commit()
    print(f"Successfully synced {len(df)} preorders.")

def main():
    print("Starting relational data synchronization...")
    init_db()
    db = SessionLocal()
    try:
        subseries_map = sync_series_and_subseries(db)
        sync_cars(db, subseries_map)
        sync_preorders(db)
        print("Relational synchronization complete!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
