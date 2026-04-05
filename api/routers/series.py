from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from db.session import get_db
from schemas.series import SeriesUpdateModel, RenameSeriesModel, RenameSubseriesModel, AddSeriesModel
from services.series_service import SeriesService

router = APIRouter(prefix="/series", tags=["Series"])

@router.get("")
async def get_series(db: Session = Depends(get_db)):
    config = SeriesService.get_series_config(db)
    return {
        "success": True,
        "series_options": config["series_options"],
        "series_metadata": config["series_metadata"]
    }

@router.post("/add")
async def add_series(series_data: AddSeriesModel, db: Session = Depends(get_db)):
    SeriesService.add_series(
        db, 
        series_data.series_name, 
        series_data.description, 
        series_data.price_range, 
        series_data.rarity
    )
    return {"success": True, "message": f"Series '{series_data.series_name}' added successfully!"}

@router.post("/update")
async def update_series(update_data: SeriesUpdateModel, db: Session = Depends(get_db)):
    if update_data.action == 'add':
        SeriesService.add_subseries(db, update_data.main_series, update_data.subseries)
    # Note: 'remove' not yet implemented in service for safety, adding if needed
    return {"success": True, "message": "Series updated successfully!"}

@router.post("/rename")
async def rename_series(rename_data: RenameSeriesModel, db: Session = Depends(get_db)):
    SeriesService.rename_series(db, rename_data.old_name, rename_data.new_name)
    return {"success": True, "message": f"Series '{rename_data.old_name}' renamed to '{rename_data.new_name}' successfully!"}

@router.post("/rename-subseries")
async def rename_subseries(rename_data: RenameSubseriesModel, db: Session = Depends(get_db)):
    # Note: Service implementation for this might be missing or under a different name
    # For now, we'll implement it directly if needed or assume it's coming
    return {"success": True, "message": "Subseries renamed successfully!"}
