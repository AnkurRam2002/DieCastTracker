from sqlalchemy.orm import Session
from db.models import Preorder
from services.excel_service import ExcelService
from core.exceptions import AppException, EntityNotFoundException
from core.config import settings
from datetime import datetime
import pandas as pd
import os

class PreorderService:
    PREORDERS_FILE_PATH = os.path.join("data", "preorders.xlsx")

    @staticmethod
    def get_all_preorders(db: Session):
        return db.query(Preorder).order_by(Preorder.serial_number).all()

    @staticmethod
    def add_preorder(db: Session, seller: str, models: str, eta: str, total_price: float, po_amount: float, on_arrival_amount: float, delivery_status: str = "Pending"):
        from sqlalchemy import func
        
        # 1. Determine next serial number from Database
        max_serial = db.query(func.max(Preorder.serial_number)).scalar() or 0
        serial_number = max_serial + 1
        date_added = datetime.now().strftime("%Y-%m-%d")
        
        # 2. Update Database First
        try:
            new_po = Preorder(
                serial_number=serial_number,
                seller=seller.strip(),
                models=models.strip(),
                eta=eta,
                total_price=total_price,
                po_amount=po_amount,
                on_arrival_amount=on_arrival_amount,
                delivery_status=delivery_status,
                date_added=date_added
            )
            db.add(new_po)
            db.commit()
            db.refresh(new_po)
        except Exception as e:
            db.rollback()
            raise AppException(f"Database error while adding preorder: {str(e)}")

        # 3. Update Excel Second
        try:
            wb = ExcelService.get_workbook(PreorderService.PREORDERS_FILE_PATH)
            ws = wb.active
            
            # Ensure headers if new file
            if ws.max_row == 1 and ws.cell(row=1, column=1).value is None:
                ws.append(["S.No", "Seller", "Models", "ETA", "Total Price", "PO Amount", "On Arrival Amount", "Delivery Status", "Date Added"])
            
            ws.append([
                serial_number,
                seller.strip(),
                models.strip(),
                eta,
                total_price,
                po_amount,
                on_arrival_amount,
                delivery_status,
                date_added
            ])
            ExcelService.save_workbook(wb, PreorderService.PREORDERS_FILE_PATH)
        except Exception as e:
            print(f"[WARNING] Excel update failed for add_preorder: {e}")
            # We don't rollback the DB here as the DB is the source of truth
            # But the user might want to know Excel failed
            
        return new_po

    @staticmethod
    def update_preorder(db: Session, serial_number: int, updates: dict):
        # 1. Update Database First
        try:
            po = db.query(Preorder).filter(Preorder.serial_number == serial_number).first()
            if not po:
                raise EntityNotFoundException("Preorder", str(serial_number))
            
            # Map of possible input keys to model attributes
            key_map = {
                "Seller": "seller", "seller": "seller",
                "Models": "models", "models": "models",
                "ETA": "eta", "eta": "eta",
                "Total Price": "total_price", "total_price": "total_price",
                "PO Amount": "po_amount", "po_amount": "po_amount",
                "On Arrival Amount": "on_arrival_amount", "on_arrival_amount": "on_arrival_amount",
                "Delivery Status": "delivery_status", "delivery_status": "delivery_status"
            }

            for raw_key, value in updates.items():
                model_key = key_map.get(raw_key, raw_key.lower().replace(" ", "_"))
                if hasattr(po, model_key):
                    if model_key in ['total_price', 'po_amount', 'on_arrival_amount']:
                        try:
                            # Handle string numbers with currency or commas if they slip through
                            if isinstance(value, str):
                                value = value.replace('₹', '').replace(',', '').strip()
                            setattr(po, model_key, float(value) if value and str(value).strip() else 0.0)
                        except (ValueError, TypeError):
                            setattr(po, model_key, 0.0)
                    else:
                        setattr(po, model_key, str(value).strip() if value is not None else "")
            
            db.commit()
            db.refresh(po)
        except Exception as e:
            db.rollback()
            raise AppException(f"Database error while updating preorder: {str(e)}")

        # 2. Update Excel Second
        try:
            wb = ExcelService.get_workbook(PreorderService.PREORDERS_FILE_PATH)
            ws = wb.active
            
            target_row = None
            for row_num in range(2, ws.max_row + 1):
                if ws.cell(row=row_num, column=1).value == serial_number:
                    target_row = row_num
                    break
            
            if target_row:
                headers = [cell.value for cell in ws[1]]
                # Map model attributes to Excel headers
                field_mapping = {
                    'seller': 'Seller',
                    'models': 'Models',
                    'eta': 'ETA',
                    'total_price': 'Total Price',
                    'po_amount': 'PO Amount',
                    'on_arrival_amount': 'On Arrival Amount',
                    'delivery_status': 'Delivery Status'
                }
                
                # Use the updated data from the DB object `po` to ensure Excel stays in sync
                for attr, excel_header in field_mapping.items():
                    if excel_header in headers:
                        col_index = headers.index(excel_header) + 1
                        val = getattr(po, attr)
                        ws.cell(row=target_row, column=col_index, value=val if val is not None else "")
                
                ExcelService.save_workbook(wb, PreorderService.PREORDERS_FILE_PATH)
        except Exception as e:
            print(f"[WARNING] Excel update failed for update_preorder: {e}")
            
        return po

    @staticmethod
    def delete_preorder(db: Session, serial_number: int):
        # 1. Update Database First
        try:
            db.query(Preorder).filter(Preorder.serial_number == serial_number).delete()
            # Re-index all to ensure sequential IDs (No Holes)
            all_pos = db.query(Preorder).order_by(Preorder.serial_number).all()
            for idx, po in enumerate(all_pos, 1):
                po.serial_number = idx
            db.commit()
        except Exception as e:
            db.rollback()
            raise AppException(f"Database error while deleting preorder: {str(e)}")

        # 2. Update Excel Second
        try:
            wb = ExcelService.get_workbook(PreorderService.PREORDERS_FILE_PATH)
            ws = wb.active
            
            target_row = None
            for row_num in range(2, ws.max_row + 1):
                if ws.cell(row=row_num, column=1).value == serial_number:
                    target_row = row_num
                    break
            
            if target_row:
                ws.delete_rows(target_row)
                # Re-index Excel too
                for row_num in range(2, ws.max_row + 1):
                    ws.cell(row=row_num, column=1, value=row_num - 1)
                ExcelService.save_workbook(wb, PreorderService.PREORDERS_FILE_PATH)
        except Exception as e:
            print(f"[WARNING] Excel update failed for delete_preorder: {e}")
            
        return True

    @staticmethod
    def get_statistics(db: Session):
        preorders = db.query(Preorder).all()
        if not preorders:
            return {}
            
        total_preorders = len(preorders)
        total_value = sum(po.total_price or 0 for po in preorders)
        total_po_amount = sum(po.po_amount or 0 for po in preorders)
        total_on_arrival = sum(po.on_arrival_amount or 0 for po in preorders)
        
        status_breakdown = {}
        active_paid = 0
        active_remaining = 0
        upcoming_arrivals = []
        
        today = datetime.now()
        current_month = today.strftime("%Y-%m")
        next_month = (today.replace(day=28) + pd.Timedelta(days=4)).strftime("%Y-%m")

        for po in preorders:
            status = po.delivery_status or "Pending"
            status_breakdown[status] = status_breakdown.get(status, 0) + 1
            
            if status.lower() != "delivered":
                active_paid += (po.po_amount or 0)
                if status.lower() in ["paid", "shipped"]:
                    active_paid += (po.on_arrival_amount or 0)
                elif status.lower() == "pending":
                    active_remaining += (po.on_arrival_amount or 0)

            if status != "Delivered" and po.eta:
                eta_month = str(po.eta)[:7]
                if eta_month == current_month or eta_month == next_month:
                    upcoming_arrivals.append({
                        "serial": po.serial_number,
                        "models": po.models,
                        "eta": eta_month,
                        "seller": po.seller,
                        "status": status
                    })
        
        return {
            "total_preorders": total_preorders,
            "total_value": round(total_value, 2),
            "total_po_amount": round(total_po_amount, 2),
            "total_on_arrival": round(total_on_arrival, 2),
            "active_paid": round(active_paid, 2),
            "active_remaining": round(active_remaining, 2),
            "status_breakdown": status_breakdown,
            "upcoming_arrivals": sorted(upcoming_arrivals, key=lambda x: x["eta"])
        }
