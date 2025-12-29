#!/usr/bin/env python3
"""
DieCastTracker - Backup Cleanup Script
One-time script to clean up existing backups, keeping only the 5 most recent per file
"""

import os
import sys
import glob

# Add utils directory to path
sys.path.insert(0, os.path.dirname(__file__))
from backup_utils import cleanup_old_backups

def cleanup_all_backups(backup_dir=None, max_backups=5):
    """
    Clean up all backups in the backup directory, keeping only max_backups per file
    """
    # Get the workspace root directory (parent of utils)
    if backup_dir is None:
        workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        backup_dir = os.path.join(workspace_root, "data", "backups")
    
    if not os.path.exists(backup_dir):
        print(f"Backup directory does not exist: {backup_dir}")
        return
    
    # Find all unique base filenames from backup files
    pattern = os.path.join(backup_dir, "*_backup_*.xlsx")
    all_backup_files = glob.glob(pattern)
    
    # Extract base filenames (e.g., "HW_list" or "preorders")
    base_filenames = set()
    for backup_file in all_backup_files:
        filename = os.path.basename(backup_file)
        # Extract base filename (everything before "_backup_")
        if "_backup_" in filename:
            base_filename = filename.split("_backup_")[0]
            base_filenames.add(base_filename)
    
    print(f"Found backups for {len(base_filenames)} file(s): {', '.join(base_filenames)}")
    print(f"Cleaning up to keep {max_backups} most recent backups per file...\n")
    
    # Clean up backups for each base filename
    for base_filename in base_filenames:
        print(f"Cleaning up backups for: {base_filename}")
        cleanup_old_backups(backup_dir, base_filename, max_backups)
        print()
    
    print("[SUCCESS] Backup cleanup completed!")

if __name__ == "__main__":
    cleanup_all_backups()

