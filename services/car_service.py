from sqlalchemy.orm import Session
from db.models import Car, Subseries, Series
from services.excel_service import ExcelService
from core.exceptions import AppException, EntityNotFoundException
from core.config import settings

class CarService:
    @staticmethod
    def get_all_cars(db: Session):
        return db.query(Car).join(Subseries).join(Series).order_by(Car.serial_number).all()

    @staticmethod
    def add_car(db: Session, model_name: str, series_name: str, subseries_name: str):
        # 1. Update Excel
        wb = ExcelService.get_workbook()
        ws = wb.active
        last_serial_number = ws.max_row
        
        # In this app's logic, subseries_name is stored in the "Series" column in Excel
        ws.append([last_serial_number, model_name.strip(), subseries_name])
        excel_updated = ExcelService.save_workbook(wb)
        
        # 2. Update Database (Dual-Write)
        try:
            # Find or create series
            series = db.query(Series).filter(Series.name == series_name).first()
            if not series:
                series = Series(name=series_name)
                db.add(series)
                db.flush()
            
            # Find or create subseries
            subseries = db.query(Subseries).filter(
                Subseries.name == subseries_name, 
                Subseries.series_id == series.id
            ).first()
            if not subseries:
                subseries = Subseries(name=subseries_name, series_id=series.id)
                db.add(subseries)
                db.flush()
            
            new_car = Car(
                serial_number=last_serial_number,
                model_name=model_name.strip(),
                subseries_id=subseries.id
            )
            db.add(new_car)
            db.commit()
            return new_car
        except Exception as e:
            db.rollback()
            if not excel_updated:
                raise AppException(f"Failed to save to both Excel and Database: {str(e)}")
            print(f"[WARNING] Database update failed for add_car: {e}")
            return None

    @staticmethod
    def update_car(db: Session, serial_number: int, updates: dict):
        # 1. Update Excel
        wb = ExcelService.get_workbook()
        ws = wb.active
        
        target_row = None
        for row_num in range(2, ws.max_row + 1):
            if ws.cell(row=row_num, column=1).value == serial_number:
                target_row = row_num
                break
        
        if not target_row:
            raise EntityNotFoundException("Car", str(serial_number))
            
        headers = [cell.value for cell in ws[1]]
        for field_name, new_value in updates.items():
            if field_name in headers:
                col_index = headers.index(field_name) + 1
                ws.cell(row=target_row, column=col_index, value=str(new_value).strip() if new_value else "")
        
        excel_updated = ExcelService.save_workbook(wb)
        
        # 2. Update Database
        try:
            car = db.query(Car).filter(Car.serial_number == serial_number).first()
            if car:
                if "Model Name" in updates:
                    car.model_name = str(updates["Model Name"]).strip()
                if "Series" in updates: # "Series" in Excel is subseries in DB
                    new_sub_name = str(updates["Series"]).strip()
                    # Note: Simplified subseries lookup here, assuming it exists
                    sub_obj = db.query(Subseries).filter(Subseries.name == new_sub_name).first()
                    if sub_obj:
                        car.subseries_id = sub_obj.id
                db.commit()
                return car
        except Exception as e:
            db.rollback()
            if not excel_updated:
                raise AppException(f"Failed to update both Excel and Database: {str(e)}")
            print(f"[WARNING] Database update failed for update_car: {e}")
            return None

    @staticmethod
    def delete_car(db: Session, serial_number: int):
        # 1. Update Excel
        wb = ExcelService.get_workbook()
        ws = wb.active
        
        target_row = None
        for row_num in range(2, ws.max_row + 1):
            if ws.cell(row=row_num, column=1).value == serial_number:
                target_row = row_num
                break
        
        if not target_row:
            raise EntityNotFoundException("Car", str(serial_number))
            
        ws.delete_rows(target_row)
        # Renumber
        for row_num in range(2, ws.max_row + 1):
            ws.cell(row=row_num, column=1, value=row_num - 1)
            
        excel_updated = ExcelService.save_workbook(wb)
        
        # 2. Update Database
        try:
            db.query(Car).filter(Car.serial_number == serial_number).delete()
            # Re-sync serial numbers
            all_cars = db.query(Car).order_by(Car.serial_number).all()
            for idx, car in enumerate(all_cars, 1):
                car.serial_number = idx
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            if not excel_updated:
                raise AppException(f"Failed to delete from both Excel and Database: {str(e)}")
            print(f"[WARNING] Database delete failed for delete_car: {e}")
            return False
