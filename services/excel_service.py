import os
from typing import Optional
import pandas as pd
from openpyxl import load_workbook
from core.config import settings
from utils.backup_utils import create_backup
from core.exceptions import ExcelUpdateException

class ExcelService:
    @staticmethod
    def load_data(file_path: str = settings.EXCEL_FILE_PATH) -> Optional[pd.DataFrame]:
        try:
            if os.path.exists(file_path):
                df = pd.read_excel(file_path)
                return df.fillna("")
            return None
        except Exception as e:
            raise ExcelUpdateException(f"Error loading Excel file: {str(e)}")

    @staticmethod
    def save_workbook(wb, file_path: str = settings.EXCEL_FILE_PATH):
        try:
            if os.path.exists(file_path):
                create_backup(file_path)
            wb.save(file_path)
        except Exception as e:
            print(f"[WARNING] Excel update failed (file might be locked): {e}")
            # We don't necessarily want to crash everything if Excel is locked, 
            # as the DB update might have succeeded.
            return False
        return True

    @staticmethod
    def get_workbook(file_path: str = settings.EXCEL_FILE_PATH):
        if not os.path.exists(file_path):
            raise ExcelUpdateException("Excel file not found")
        return load_workbook(file_path)
