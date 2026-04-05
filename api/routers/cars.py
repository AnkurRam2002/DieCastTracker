from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from db.session import get_db
from db.models import Car, Series, Subseries
from schemas.car import NewCarModel, UpdateCarModel, DeleteCarModel, CarRead
from services.car_service import CarService
from services.excel_service import ExcelService
from services.series_service import SeriesService

router = APIRouter(tags=["Cars"])

@router.get("/data")
async def get_cars(db: Session = Depends(get_db)):
    cars = CarService.get_all_cars(db)
    data = []
    for car in cars:
        data.append({
            "S.No": car.serial_number,
            "Model Name": car.model_name,
            "Series": car.subseries.name if car.subseries else "",
            "Main Series": car.subseries.series.name if car.subseries and car.subseries.series else ""
        })
    
    return {
        "success": True,
        "data": data,
        "columns": ["S.No", "Model Name", "Series", "Main Series"],
        "total_records": len(data)
    }

@router.post("/add-model")
async def add_car(car_data: NewCarModel, db: Session = Depends(get_db)):
    car = CarService.add_car(db, car_data.model_name, car_data.series, car_data.subseries)
    return {
        "success": True,
        "message": f"Successfully added '{car_data.model_name}' to the collection!",
        "serial_number": car.serial_number if car else None
    }

@router.put("/update-model")
async def update_car(car_data: UpdateCarModel, db: Session = Depends(get_db)):
    CarService.update_car(db, car_data.serial_number, car_data.updates)
    return {"success": True, "message": f"Successfully updated model with serial number {car_data.serial_number}!"}

@router.delete("/delete-model")
async def delete_car(car_data: DeleteCarModel, db: Session = Depends(get_db)):
    CarService.delete_car(db, car_data.serial_number)
    return {"success": True, "message": f"Successfully deleted model with serial number {car_data.serial_number}!"}

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    total_models = db.query(Car).count()
    
    # Series breakdown
    series_counts = db.query(Series.name, func.count(Car.serial_number)).\
        join(Subseries, Series.id == Subseries.series_id).\
        join(Car, Subseries.id == Car.subseries_id).\
        group_by(Series.name).all()
    
    # Subseries breakdown
    subseries_counts = db.query(Subseries.name, func.count(Car.serial_number)).\
        join(Car, Subseries.id == Car.subseries_id).\
        group_by(Subseries.name).all()

    stats = {
        "total_models": total_models,
        "column_info": {
            "Main Series": {
                "type": "text",
                "unique_values": len(series_counts),
                "top_values": dict(series_counts)
            },
            "Series": {
                "type": "text",
                "unique_values": len(subseries_counts),
                "top_values": dict(subseries_counts)
            }
        }
    }
    return {"success": True, "stats": stats}

@router.get("/search")
async def search_cars(q: str = "", db: Session = Depends(get_db)):
    search_query = f"%{q}%"
    cars = db.query(Car).join(Subseries).join(Series).\
        filter(
            (Car.model_name.ilike(search_query)) | 
            (Subseries.name.ilike(search_query)) | 
            (Series.name.ilike(search_query))
        ).all()
    
    data = []
    for car in cars:
        data.append({
            "S.No": car.serial_number,
            "Model Name": car.model_name,
            "Series": car.subseries.name if car.subseries else "",
            "Main Series": car.subseries.series.name if car.subseries and car.subseries.series else ""
        })
    return {
        "success": True,
        "data": data,
        "total_found": len(data),
        "search_query": q
    }

@router.get("/dropdown-options")
async def get_dropdown_options(db: Session = Depends(get_db)):
    config = SeriesService.get_series_config(db)
    return {
        "success": True,
        "series": config["series_options"]
    }
