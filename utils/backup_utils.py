#!/usr/bin/env python3
"""
DieCastTracker - Backup Utilities
Utility functions for creating backups before updates/deletes
"""

import os
import shutil
from datetime import datetime

def create_backup(file_path, backup_dir="data/backups"):
    """
    Create a backup of the Excel file before making changes
    Overwrites the previous backup to keep only the latest one
    """
    try:
        # Create backup directory if it doesn't exist
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        # Create backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"HW_list_backup_{timestamp}.xlsx"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Copy the file
        shutil.copy2(file_path, backup_path)
        
        # Also create/overwrite the "latest" backup
        latest_backup = os.path.join(backup_dir, "HW_list_backup_latest.xlsx")
        shutil.copy2(file_path, latest_backup)
        
        print(f"✅ Backup created: {backup_filename}")
        print(f"✅ Latest backup: HW_list_backup_latest.xlsx")
        return True
        
    except Exception as e:
        print(f"❌ Error creating backup: {e}")
        return False

def restore_from_backup(file_path, backup_dir="data/backups"):
    """
    Restore from the latest backup
    """
    try:
        latest_backup = os.path.join(backup_dir, "HW_list_backup_latest.xlsx")
        
        if not os.path.exists(latest_backup):
            print("❌ No backup found to restore from")
            return False
        
        shutil.copy2(latest_backup, file_path)
        print("✅ Restored from latest backup")
        return True
        
    except Exception as e:
        print(f"❌ Error restoring from backup: {e}")
        return False

if __name__ == "__main__":
    # Test the backup function
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'HW_list.xlsx')
    if os.path.exists(file_path):
        create_backup(file_path)
    else:
        print("❌ Excel file not found for testing")
