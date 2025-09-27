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

# Static dropdown options - series with their subseries
SERIES_OPTIONS = {
    "Mainlines": [
        "Mainlines",
        "57th Anniversary Series"
    ],
    "Semi-Premiums": [
        "Ultra Hots",
        "Silver Series BMW",
        "Silver Series Fast & Furious Villains",
        "HW Speed Graphics",
        "Neon Speeders",
        "1/4 Mile Finals Series",
        "Fast & Furious Hobbs & Shaw"
    ],
    "Premiums": [
        "Premiums Pop Culture",
        "Premiums Boulevard"
    ]
}

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)