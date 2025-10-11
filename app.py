#!/usr/bin/env python3
"""
DieCastTracker - FastAPI Web Application
Hot Wheels Collection Management System - Web Interface
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import pandas as pd
import os
from typing import List, Dict, Any
import uvicorn
from openpyxl import load_workbook
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))
from scripts.backup_utils import create_backup
from scripts.series_config import SERIES_OPTIONS, SERIES_METADATA, get_all_series, get_subseries, get_series_info
from collections import Counter
from datetime import datetime

app = FastAPI(
    title="DieCast Tracker",
    description="Hot Wheels Collection Management System - Web Interface",
    version="1.0.0"
)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Path to the Excel file
EXCEL_FILE_PATH = os.path.join("data", "HW_list.xlsx")

# Data model for adding new cars
class NewCarModel(BaseModel):
    model_name: str
    series: str
    subseries: str

# Data model for updating cars
class UpdateCarModel(BaseModel):
    serial_number: int
    model_name: str = None
    series: str = None
    subseries: str = None

# Data model for deleting cars
class DeleteCarModel(BaseModel):
    serial_number: int

# Data model for series management
class SeriesUpdateModel(BaseModel):
    main_series: str
    subseries: str
    action: str  # 'add' or 'remove'

class SeriesMetadataModel(BaseModel):
    main_series: str
    description: str = None
    price_range: str = None
    rarity: str = None


def load_excel_data() -> pd.DataFrame:
    """Load data from the Excel file"""
    try:
        if os.path.exists(EXCEL_FILE_PATH):
            df = pd.read_excel(EXCEL_FILE_PATH)
            # Convert NaN values to empty strings for better JSON serialization
            df = df.fillna("")
            return df
        else:
            raise FileNotFoundError(f"Excel file not found: {EXCEL_FILE_PATH}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading Excel file: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with the data table"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/add", response_class=HTMLResponse)
async def add_model_page(request: Request):
    """Add model page with dropdown form"""
    return templates.TemplateResponse("add_model.html", {"request": request})

@app.get("/api/data")
async def get_data() -> JSONResponse:
    """Get all Excel data as JSON"""
    try:
        df = load_excel_data()
        
        # Convert DataFrame to list of dictionaries
        data = df.to_dict('records')
        
        # Get column names
        columns = df.columns.tolist()
        
        # Get basic statistics
        total_records = len(df)
        
        response_data = {
            "success": True,
            "data": data,
            "columns": columns,
            "total_records": total_records,
            "message": f"Successfully loaded {total_records} records"
        }
        
        return JSONResponse(content=response_data)
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "data": [],
                "columns": [],
                "total_records": 0,
                "message": f"Error: {str(e)}"
            }
        )

@app.get("/api/stats")
async def get_statistics() -> JSONResponse:
    """Get collection statistics"""
    try:
        df = load_excel_data()
        
        stats = {
            "total_models": len(df),
            "columns": df.columns.tolist(),
            "column_info": {}
        }
        
        # Get information about each column
        for col in df.columns:
            if df[col].dtype == 'object':  # String columns
                unique_values = df[col].value_counts()
                stats["column_info"][col] = {
                    "type": "text",
                    "unique_values": len(unique_values),
                    "top_values": unique_values.head(5).to_dict() if len(unique_values) > 0 else {}
                }
            else:  # Numeric columns
                stats["column_info"][col] = {
                    "type": "numeric",
                    "min": float(df[col].min()) if pd.notna(df[col].min()) else 0,
                    "max": float(df[col].max()) if pd.notna(df[col].max()) else 0,
                    "mean": float(df[col].mean()) if pd.notna(df[col].mean()) else 0
                }
        
        return JSONResponse(content={"success": True, "stats": stats})
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/dropdown-options")
async def get_dropdown_options() -> JSONResponse:
    """Get dropdown options for series and their subseries"""
    try:
        return JSONResponse(content={
            "success": True,
            "series": SERIES_OPTIONS
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/add-model")
async def add_new_model(model: NewCarModel) -> JSONResponse:
    """Add a new model to the Excel file"""
    try:
        # Load existing workbook or create new one
        if os.path.exists(EXCEL_FILE_PATH):
            wb = load_workbook(EXCEL_FILE_PATH)
            ws = wb.active
            last_serial_number = ws.max_row
        else:
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            ws.append(["S.No", "Model Name", "Series"])
            last_serial_number = 1
        
        # Add new row (using subseries as the series field in Excel)
        ws.append([
            last_serial_number,
            model.model_name.strip(),
            model.subseries
        ])
        
        # Save workbook
        wb.save(EXCEL_FILE_PATH)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Successfully added '{model.model_name}' to the collection!",
            "serial_number": last_serial_number
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/search")
async def search_data(q: str = "") -> JSONResponse:
    """Search through the data"""
    try:
        df = load_excel_data()
        
        if not q:
            # Return all data if no search query
            data = df.to_dict('records')
        else:
            # Search across all text columns
            mask = pd.Series([False] * len(df))
            for col in df.select_dtypes(include=['object']).columns:
                mask |= df[col].astype(str).str.contains(q, case=False, na=False)
            
            filtered_df = df[mask]
            data = filtered_df.to_dict('records')
        
        return JSONResponse(content={
            "success": True,
            "data": data,
            "total_found": len(data),
            "search_query": q
        })
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.put("/api/update-model")
async def update_model(model: UpdateCarModel) -> JSONResponse:
    """Update an existing model in the Excel file"""
    try:
        # Create backup before update
        if not create_backup(EXCEL_FILE_PATH):
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Failed to create backup"}
            )
        
        # Load existing workbook
        if not os.path.exists(EXCEL_FILE_PATH):
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "Excel file not found"}
            )
        
        wb = load_workbook(EXCEL_FILE_PATH)
        ws = wb.active
        
        # Find the row with the given serial number
        target_row = None
        for row_num in range(2, ws.max_row + 1):
            if ws.cell(row=row_num, column=1).value == model.serial_number:
                target_row = row_num
                break
        
        if target_row is None:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": f"Model with serial number {model.serial_number} not found"}
            )
        
        # Update the fields that are provided
        if model.model_name is not None:
            ws.cell(row=target_row, column=2, value=model.model_name.strip())
        if model.subseries is not None:
            ws.cell(row=target_row, column=3, value=model.subseries)
        
        # Save workbook
        wb.save(EXCEL_FILE_PATH)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Successfully updated model with serial number {model.serial_number}!"
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.delete("/api/delete-model")
async def delete_model(model: DeleteCarModel) -> JSONResponse:
    """Delete a model from the Excel file"""
    try:
        # Create backup before deletion
        if not create_backup(EXCEL_FILE_PATH):
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Failed to create backup"}
            )
        
        # Load existing workbook
        if not os.path.exists(EXCEL_FILE_PATH):
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "Excel file not found"}
            )
        
        wb = load_workbook(EXCEL_FILE_PATH)
        ws = wb.active
        
        # Find the row with the given serial number
        target_row = None
        for row_num in range(2, ws.max_row + 1):
            if ws.cell(row=row_num, column=1).value == model.serial_number:
                target_row = row_num
                break
        
        if target_row is None:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": f"Model with serial number {model.serial_number} not found"}
            )
        
        # Delete the row
        ws.delete_rows(target_row)
        
        # Renumber serial numbers
        for row_num in range(2, ws.max_row + 1):
            ws.cell(row=row_num, column=1, value=row_num - 1)
        
        # Save workbook
        wb.save(EXCEL_FILE_PATH)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Successfully deleted model with serial number {model.serial_number}!"
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

# Analytics Routes
@app.get("/analytics", response_class=HTMLResponse)
async def analytics_page(request: Request):
    """Analytics page"""
    return templates.TemplateResponse("analytics.html", {"request": request})

@app.get("/api/analytics")
async def get_analytics() -> JSONResponse:
    """Get comprehensive analytics data"""
    try:
        df = load_excel_data()
        
        if df.empty:
            return JSONResponse(content={
                "success": True,
                "analytics": {
                    "total_models": 0,
                    "series_breakdown": {},
                    "recent_additions": [],
                    "collection_goals": {},
                    "model_insights": {}
                }
            })
        
        # Basic statistics
        total_models = len(df)
        
        # Series breakdown
        series_column = 'Series' if 'Series' in df.columns else df.columns[2] if len(df.columns) > 2 else None
        series_breakdown = {}
        if series_column:
            series_counts = df[series_column].value_counts()
            series_breakdown = series_counts.to_dict()
        
        # Recent additions (last 10)
        recent_additions = df.tail(10).to_dict('records')
        
        # Collection goals
        milestones = [10, 25, 50, 100, 250, 500, 1000]
        next_milestone = None
        for milestone in milestones:
            if total_models < milestone:
                next_milestone = milestone
                break
        
        collection_goals = {
            "current_count": total_models,
            "next_milestone": next_milestone,
            "progress_percentage": (total_models / next_milestone * 100) if next_milestone else 100
        }
        
        # Model insights
        model_column = 'Model Name' if 'Model Name' in df.columns else df.columns[1] if len(df.columns) > 1 else None
        model_insights = {}
        if model_column:
            model_names = df[model_column].dropna().astype(str)
            # Find common words
            all_words = []
            for name in model_names:
                all_words.extend(name.lower().split())
            word_counts = Counter(all_words)
            model_insights = {
                "common_words": dict(word_counts.most_common(10)),
                "average_name_length": model_names.str.len().mean()
            }
        
        return JSONResponse(content={
            "success": True,
            "analytics": {
                "total_models": total_models,
                "series_breakdown": series_breakdown,
                "recent_additions": recent_additions,
                "collection_goals": collection_goals,
                "model_insights": model_insights
            }
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

# Series Management Routes
@app.get("/series", response_class=HTMLResponse)
async def series_management_page(request: Request):
    """Series management page"""
    return templates.TemplateResponse("series_management.html", {"request": request})

@app.get("/api/series")
async def get_series_config() -> JSONResponse:
    """Get current series configuration"""
    try:
        return JSONResponse(content={
            "success": True,
            "series_options": SERIES_OPTIONS,
            "series_metadata": SERIES_METADATA
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/series/update")
async def update_series_config(update: SeriesUpdateModel) -> JSONResponse:
    """Update series configuration"""
    try:
        # This would require modifying the series_config.py file
        # For now, return a message that this feature needs CLI access
        return JSONResponse(content={
            "success": False,
            "message": "Series configuration updates require CLI access. Please use the manage_series.py script or option 9 in the main CLI menu."
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/series/metadata")
async def update_series_metadata(metadata: SeriesMetadataModel) -> JSONResponse:
    """Update series metadata"""
    try:
        # This would require modifying the series_config.py file
        # For now, return a message that this feature needs CLI access
        return JSONResponse(content={
            "success": False,
            "message": "Series metadata updates require CLI access. Please use the manage_series.py script or option 9 in the main CLI menu."
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)