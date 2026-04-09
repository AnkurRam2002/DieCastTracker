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
        from sqlalchemy import func
        
        # 1. Determine next serial number from Database (Primary Source of Truth)
        max_serial = db.query(func.max(Car.serial_number)).scalar() or 0
        serial_number = max_serial + 1
        
        # 2. Update Database (Dual-Write start)
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
                serial_number=serial_number,
                model_name=model_name.strip(),
                subseries_id=subseries.id
            )
            db.add(new_car)
            db.commit()
            db.refresh(new_car)
        except Exception as e:
            db.rollback()
            raise AppException(f"Database update failed. No changes were made to Excel: {str(e)}")

        # 3. Update Excel (Delayed Write)
        try:
            wb = ExcelService.get_workbook()
            ws = wb.active
            # In this app's logic, subseries_name is stored in the "Series" column in Excel
            ws.append([serial_number, model_name.strip(), subseries_name])
            ExcelService.save_workbook(wb)
        except Exception as e:
            print(f"[WARNING] Excel update failed for add_car (ID {serial_number}): {e}")
            # We don't fail the whole operation since DB is consistent
            
        return new_car

    @staticmethod
    def update_car(db: Session, serial_number: int, updates: dict):
        # 1. Update Database First
        try:
            car = db.query(Car).filter(Car.serial_number == serial_number).first()
            if not car:
                raise EntityNotFoundException("Car", str(serial_number))
                
            if "Model Name" in updates:
                car.model_name = str(updates["Model Name"]).strip()
            if "Series" in updates: # "Series" in Excel is subseries in DB
                new_sub_name = str(updates["Series"]).strip()
                # Find which series this subseries might belong to (context: usually stays in same main series)
                sub_obj = db.query(Subseries).filter(Subseries.name == new_sub_name).first()
                if sub_obj:
                    car.subseries_id = sub_obj.id
            
            db.commit()
            db.refresh(car)
        except Exception as e:
            db.rollback()
            if isinstance(e, EntityNotFoundException): raise e
            raise AppException(f"Database update failed. Excel was not modified: {str(e)}")

        # 2. Update Excel Second
        try:
            wb = ExcelService.get_workbook()
            ws = wb.active
            
            target_row = None
            for row_num in range(2, ws.max_row + 1):
                if ws.cell(row=row_num, column=1).value == serial_number:
                    target_row = row_num
                    break
            
            if target_row:
                headers = [cell.value for cell in ws[1]]
                for field_name, new_value in updates.items():
                    if field_name in headers:
                        col_index = headers.index(field_name) + 1
                        ws.cell(row=target_row, column=col_index, value=str(new_value).strip() if new_value else "")
                
                ExcelService.save_workbook(wb)
        except Exception as e:
            print(f"[WARNING] Excel update failed for update_car (ID {serial_number}): {e}")
            
        return car

    @staticmethod
    def delete_car(db: Session, serial_number: int):
        # 1. Update Database First (Primary)
        try:
            car = db.query(Car).filter(Car.serial_number == serial_number).first()
            if not car:
                raise EntityNotFoundException("Car", str(serial_number))
                
            db.query(Car).filter(Car.serial_number == serial_number).delete()
            # Re-sync serial numbers in DB
            all_cars = db.query(Car).order_by(Car.serial_number).all()
            for idx, car in enumerate(all_cars, 1):
                car.serial_number = idx
            db.commit()
        except Exception as e:
            db.rollback()
            if isinstance(e, EntityNotFoundException): raise e
            raise AppException(f"Database delete failed. Excel was not modified: {str(e)}")

        # 2. Update Excel Second
        try:
            wb = ExcelService.get_workbook()
            ws = wb.active
            
            target_row = None
            for row_num in range(2, ws.max_row + 1):
                if ws.cell(row=row_num, column=1).value == serial_number:
                    target_row = row_num
                    break
            
            if target_row:
                ws.delete_rows(target_row)
                # Renumber Excel
                for row_num in range(2, ws.max_row + 1):
                    ws.cell(row=row_num, column=1, value=row_num - 1)
                ExcelService.save_workbook(wb)
        except Exception as e:
            print(f"[WARNING] Excel delete failed for delete_car (ID {serial_number}): {e}")
            
        return True
