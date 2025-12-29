#!/usr/bin/env python3
"""
DieCastTracker - Backup Utilities
Utility functions for creating backups before updates/deletes
Keeps at most 5 backups per Excel file
"""

import os
import shutil
from datetime import datetime
import glob

def create_backup(file_path, backup_dir="data/backups", max_backups=5):
    """
    Create a backup of the Excel file before making changes
    Keeps at most max_backups (default 5) backups per file, deleting the oldest ones
    """
    try:
        # Create backup directory if it doesn't exist
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        # Extract base filename without extension (e.g., "HW_list" or "preorders")
        base_filename = os.path.splitext(os.path.basename(file_path))[0]
        
        # Create backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"{base_filename}_backup_{timestamp}.xlsx"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Copy the file
        shutil.copy2(file_path, backup_path)
        
        # Also create/overwrite the "latest" backup
        latest_backup = os.path.join(backup_dir, f"{base_filename}_backup_latest.xlsx")
        shutil.copy2(file_path, latest_backup)
        
        # Clean up old backups - keep only the most recent max_backups
        cleanup_old_backups(backup_dir, base_filename, max_backups)
        
        print(f"[SUCCESS] Backup created: {backup_filename}")
        print(f"[SUCCESS] Latest backup: {base_filename}_backup_latest.xlsx")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error creating backup: {e}")
        return False

def cleanup_old_backups(backup_dir, base_filename, max_backups=5):
    """
    Remove old backups, keeping only the most recent max_backups backups
    Excludes the "latest" backup from the count
    """
    try:
        # Find all backup files for this base filename (excluding "latest")
        pattern = os.path.join(backup_dir, f"{base_filename}_backup_*.xlsx")
        backup_files = glob.glob(pattern)
        
        # Filter out the "latest" backup
        backup_files = [f for f in backup_files if not f.endswith(f"{base_filename}_backup_latest.xlsx")]
        
        if len(backup_files) <= max_backups:
            return  # No cleanup needed
        
        # Sort by modification time (newest first)
        backup_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        
        # Delete the oldest backups beyond max_backups
        files_to_delete = backup_files[max_backups:]
        for file_path in files_to_delete:
            try:
                os.remove(file_path)
                print(f"[INFO] Deleted old backup: {os.path.basename(file_path)}")
            except Exception as e:
                print(f"[WARNING] Could not delete old backup {os.path.basename(file_path)}: {e}")
        
    except Exception as e:
        print(f"[WARNING] Error cleaning up old backups: {e}")

def restore_from_backup(file_path, backup_dir="data/backups"):
    """
    Restore from the latest backup
    """
    try:
        # Extract base filename without extension
        base_filename = os.path.splitext(os.path.basename(file_path))[0]
        latest_backup = os.path.join(backup_dir, f"{base_filename}_backup_latest.xlsx")
        
        if not os.path.exists(latest_backup):
            print(f"[ERROR] No backup found to restore from: {latest_backup}")
            return False
        
        shutil.copy2(latest_backup, file_path)
        print(f"[SUCCESS] Restored from latest backup: {os.path.basename(latest_backup)}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error restoring from backup: {e}")
        return False

if __name__ == "__main__":
    # Test the backup function
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'HW_list.xlsx')
    if os.path.exists(file_path):
        create_backup(file_path)
    else:
        print("[ERROR] Excel file not found for testing")
