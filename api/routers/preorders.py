from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from db.session import get_db
from schemas.preorder import PreorderModel, PreorderRead
from services.preorder_service import PreorderService

router = APIRouter(prefix="/preorders", tags=["Preorders"])

@router.get("")
async def get_preorders(db: Session = Depends(get_db)):
    preorders = PreorderService.get_all_preorders(db)
    data = []
    for po in preorders:
        data.append({
            "S.No": po.serial_number,
            "Seller": po.seller,
            "Models": po.models,
            "ETA": po.eta,
            "Total Price": po.total_price,
            "PO Amount": po.po_amount,
            "On Arrival Amount": po.on_arrival_amount,
            "Delivery Status": po.delivery_status,
            "Date Added": po.date_added
        })
    return {
        "success": True,
        "data": data,
        "total_records": len(data)
    }

@router.post("")
async def add_preorder(preorder_data: PreorderModel, db: Session = Depends(get_db)):
    PreorderService.add_preorder(
        db,
        preorder_data.seller,
        preorder_data.models,
        preorder_data.eta,
        preorder_data.total_price,
        preorder_data.po_amount,
        preorder_data.on_arrival_amount,
        preorder_data.delivery_status
    )
    return {"success": True, "message": "Preorder added successfully!"}

@router.put("/{serial_number}")
async def update_preorder(serial_number: int, updates: dict, db: Session = Depends(get_db)):
    PreorderService.update_preorder(db, serial_number, updates)
    return {"success": True, "message": f"Successfully updated preorder #{serial_number}!"}

@router.delete("/{serial_number}")
async def delete_preorder(serial_number: int, db: Session = Depends(get_db)):
    PreorderService.delete_preorder(db, serial_number)
    return {"success": True, "message": f"Successfully deleted preorder #{serial_number}!"}

@router.get("/statistics")
async def get_preorder_statistics(db: Session = Depends(get_db)):
    stats = PreorderService.get_statistics(db)
    return {"success": True, "statistics": stats}
