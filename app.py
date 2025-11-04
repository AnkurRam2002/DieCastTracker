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
import json
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
app.mount("/pages", StaticFiles(directory="pages"), name="pages")
templates = Jinja2Templates(directory="pages")

# Path to the Excel file
EXCEL_FILE_PATH = os.path.join("data", "HW_list.xlsx")

# Path to the series config file
SERIES_CONFIG_PATH = os.path.join("scripts", "series_config.py")

def save_series_config():
    """Save the current SERIES_OPTIONS and SERIES_METADATA to series_config.py file"""
    try:
        from scripts.series_config import SERIES_OPTIONS, SERIES_METADATA
        
        # Create backup of the config file
        if os.path.exists(SERIES_CONFIG_PATH):
            backup_path = SERIES_CONFIG_PATH + ".backup"
            import shutil
            shutil.copy2(SERIES_CONFIG_PATH, backup_path)
        
        # Format the dictionaries for Python code
        # Format SERIES_OPTIONS - maintain single line format like original
        series_options_items = []
        for series, subseries_list in SERIES_OPTIONS.items():
            # Use repr() for proper string escaping
            subseries_repr = [repr(sub) for sub in subseries_list]
            series_options_items.append(f"{repr(series)}: [{', '.join(subseries_repr)}]")
        series_options_str = "{" + ", ".join(series_options_items) + "}"
        
        # Format SERIES_METADATA - maintain single line format like original
        series_metadata_items = []
        for series, metadata in SERIES_METADATA.items():
            desc = repr(metadata.get('description', 'No description available'))
            price = repr(metadata.get('price_range', 'Varies'))
            rarity = repr(metadata.get('rarity', 'Unknown'))
            series_metadata_items.append(f"{repr(series)}: {{'description': {desc}, 'price_range': {price}, 'rarity': {rarity}}}")
        series_metadata_str = "{" + ", ".join(series_metadata_items) + "}"
        
        # Generate the complete file content
        config_content = f'''#!/usr/bin/env python3
"""
DieCastTracker - Series Configuration
Centralized configuration for Hot Wheels series and subseries options
"""

# Series options as a nested dictionary
SERIES_OPTIONS = {series_options_str}

# Series metadata for additional information
SERIES_METADATA = {series_metadata_str}

def get_all_series():
    """Get all main series categories"""
    return list(SERIES_OPTIONS.keys())

def get_subseries(main_series):
    """Get subseries for a specific main series"""
    return SERIES_OPTIONS.get(main_series, [])

def get_all_subseries():
    """Get all subseries as a flat list"""
    all_subseries = []
    for subseries_list in SERIES_OPTIONS.values():
        all_subseries.extend(subseries_list)
    return all_subseries

def get_series_info(main_series):
    """Get metadata information for a main series"""
    return SERIES_METADATA.get(main_series, {{}})

def find_main_series_for_subseries(subseries):
    """Find which main series a subseries belongs to"""
    for main_series, subseries_list in SERIES_OPTIONS.items():
        if subseries in subseries_list:
            return main_series
    return None

def validate_series_combination(main_series, subseries):
    """Validate if a main series and subseries combination is valid"""
    if main_series not in SERIES_OPTIONS:
        return False
    return subseries in SERIES_OPTIONS[main_series]

def get_series_count():
    """Get total count of series and subseries"""
    main_count = len(SERIES_OPTIONS)
    sub_count = sum(len(subseries_list) for subseries_list in SERIES_OPTIONS.values())
    return main_count, sub_count

def print_series_summary():
    """Print a summary of all series options"""
    print("📊 SERIES CONFIGURATION SUMMARY")
    print("=" * 50)
    
    main_count, sub_count = get_series_count()
    print(f"Main Series Categories: {{main_count}}")
    print(f"Total Subseries: {{sub_count}}")
    print()
    
    for main_series, subseries_list in SERIES_OPTIONS.items():
        metadata = get_series_info(main_series)
        print(f"🏷️  {{main_series}} ({{len(subseries_list)}} subseries)")
        if metadata:
            print(f"   Description: {{metadata.get('description', 'N/A')}}")
            print(f"   Price Range: {{metadata.get('price_range', 'N/A')}}")
            print(f"   Rarity: {{metadata.get('rarity', 'N/A')}}")
        print(f"   Subseries: {{', '.join(subseries_list)}}")
        print()

if __name__ == "__main__":
    # Test the configuration
    print_series_summary()
    
    # Test some functions
    print("🔍 TESTING FUNCTIONS:")
    print(f"All main series: {{get_all_series()}}")
    print(f"Mainlines subseries: {{get_subseries('Mainlines')}}")
    print(f"Total series count: {{get_series_count()}}")
    print(f"Find main series for 'Ultra Hots': {{find_main_series_for_subseries('Ultra Hots')}}")
    print(f"Validate 'Mainlines' + 'Mainlines': {{validate_series_combination('Mainlines', 'Mainlines')}}")
'''
        
        # Write to file
        with open(SERIES_CONFIG_PATH, 'w', encoding='utf-8') as f:
            f.write(config_content)
        
        return True
    except Exception as e:
        print(f"Error saving series config: {e}")
        return False

# Data model for adding new cars
class NewCarModel(BaseModel):
    model_name: str
    series: str
    subseries: str

# Data model for updating cars
class UpdateCarModel(BaseModel):
    serial_number: int
    updates: Dict[str, Any]  # Dictionary of field_name: new_value pairs

# Data model for deleting cars
class DeleteCarModel(BaseModel):
    serial_number: int

# Data model for adding new field
class AddFieldModel(BaseModel):
    field_name: str

# Data model for series management
class SeriesUpdateModel(BaseModel):
    main_series: str
    subseries: str
    action: str  # 'add' or 'remove'

class RenameSeriesModel(BaseModel):
    old_name: str
    new_name: str

class RenameSubseriesModel(BaseModel):
    main_series: str
    old_name: str
    new_name: str

class AddSeriesModel(BaseModel):
    series_name: str
    description: str = None
    price_range: str = None
    rarity: str = None

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
    return templates.TemplateResponse("home/home.html", {"request": request})

@app.get("/add", response_class=HTMLResponse)
async def add_model_page(request: Request):
    """Add model page with dropdown form"""
    return templates.TemplateResponse("add-model/add-model.html", {"request": request})

@app.get("/add-field", response_class=HTMLResponse)
async def add_field_page(request: Request):
    """Add field page"""
    return templates.TemplateResponse("add-field/add-field.html", {"request": request})

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
        
        # Get headers from first row
        headers = [cell.value for cell in ws[1]]
        
        # Update the fields that are provided
        for field_name, new_value in model.updates.items():
            if field_name in headers:
                col_index = headers.index(field_name) + 1
                ws.cell(row=target_row, column=col_index, value=str(new_value).strip() if new_value else "")
        
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
    return templates.TemplateResponse("analytics/analytics.html", {"request": request})

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
        
        # Recent additions (last 10) - reversed so newest shows first
        recent_additions = df.tail(10).to_dict('records')
        recent_additions.reverse()  # Reverse to show newest first
        
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
    return templates.TemplateResponse("series-management/series-management.html", {"request": request})

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

@app.post("/api/add-field")
async def add_field(field: AddFieldModel) -> JSONResponse:
    """Add a new field/column to the Excel file"""
    try:
        # Create backup before adding field
        if not create_backup(EXCEL_FILE_PATH):
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Failed to create backup"}
            )
        
        # Validate field name
        field_name = field.field_name.strip()
        if not field_name:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Field name cannot be empty"}
            )
        
        if len(field_name) > 50:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Field name is too long (max 50 characters)"}
            )
        
        # Check for invalid characters
        invalid_chars = ['/', '\\', '?', '*', '[', ']', ':', ';']
        if any(char in field_name for char in invalid_chars):
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": f"Field name contains invalid characters: {', '.join(invalid_chars)}"}
            )
        
        # Load workbook
        if not os.path.exists(EXCEL_FILE_PATH):
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "Excel file not found"}
            )
        
        wb = load_workbook(EXCEL_FILE_PATH)
        ws = wb.active
        
        # Check if field already exists
        headers = [cell.value for cell in ws[1]]
        if field_name in headers:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": f"Field '{field_name}' already exists"}
            )
        
        # Add the new field
        new_column = len(headers) + 1
        ws.cell(row=1, column=new_column, value=field_name)
        
        # Save workbook
        wb.save(EXCEL_FILE_PATH)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Field '{field_name}' added successfully!",
            "column_index": new_column
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
        # Import series config functions
        from scripts.series_config import SERIES_OPTIONS, SERIES_METADATA
        
        if update.action == 'add':
            if update.main_series not in SERIES_OPTIONS:
                SERIES_OPTIONS[update.main_series] = []
            if update.subseries not in SERIES_OPTIONS[update.main_series]:
                SERIES_OPTIONS[update.main_series].append(update.subseries)
                # Save to file
                if save_series_config():
                    return JSONResponse(content={
                        "success": True,
                        "message": f"Subseries '{update.subseries}' added to '{update.main_series}' successfully!"
                    })
                else:
                    return JSONResponse(
                        status_code=500,
                        content={"success": False, "error": "Failed to save configuration to file"}
                    )
            else:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "error": f"Subseries '{update.subseries}' already exists in '{update.main_series}'"}
                )
        elif update.action == 'remove':
            if update.main_series in SERIES_OPTIONS:
                if update.subseries in SERIES_OPTIONS[update.main_series]:
                    SERIES_OPTIONS[update.main_series].remove(update.subseries)
                    # Save to file
                    if save_series_config():
                        return JSONResponse(content={
                            "success": True,
                            "message": f"Subseries '{update.subseries}' removed from '{update.main_series}' successfully!"
                        })
                    else:
                        return JSONResponse(
                            status_code=500,
                            content={"success": False, "error": "Failed to save configuration to file"}
                        )
        
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Invalid action or series not found"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/series/rename")
async def rename_series(rename: RenameSeriesModel) -> JSONResponse:
    """Rename a main series"""
    try:
        from scripts.series_config import SERIES_OPTIONS, SERIES_METADATA
        
        if rename.old_name not in SERIES_OPTIONS:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": f"Series '{rename.old_name}' not found"}
            )
        
        if rename.new_name in SERIES_OPTIONS:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": f"Series '{rename.new_name}' already exists"}
            )
        
        # Rename the series
        subseries_list = SERIES_OPTIONS.pop(rename.old_name)
        SERIES_OPTIONS[rename.new_name] = subseries_list
        
        # Rename metadata if it exists
        if rename.old_name in SERIES_METADATA:
            SERIES_METADATA[rename.new_name] = SERIES_METADATA.pop(rename.old_name)
        
        # Save to file
        if save_series_config():
            return JSONResponse(content={
                "success": True,
                "message": f"Series '{rename.old_name}' renamed to '{rename.new_name}' successfully!"
            })
        else:
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Failed to save configuration to file"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/series/rename-subseries")
async def rename_subseries(rename: RenameSubseriesModel) -> JSONResponse:
    """Rename a subseries"""
    try:
        from scripts.series_config import SERIES_OPTIONS
        
        if rename.main_series not in SERIES_OPTIONS:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": f"Series '{rename.main_series}' not found"}
            )
        
        if rename.old_name not in SERIES_OPTIONS[rename.main_series]:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": f"Subseries '{rename.old_name}' not found in '{rename.main_series}'"}
            )
        
        if rename.new_name in SERIES_OPTIONS[rename.main_series]:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": f"Subseries '{rename.new_name}' already exists in '{rename.main_series}'"}
            )
        
        # Rename the subseries
        index = SERIES_OPTIONS[rename.main_series].index(rename.old_name)
        SERIES_OPTIONS[rename.main_series][index] = rename.new_name
        
        # Save to file
        if save_series_config():
            return JSONResponse(content={
                "success": True,
                "message": f"Subseries '{rename.old_name}' renamed to '{rename.new_name}' successfully!"
            })
        else:
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Failed to save configuration to file"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/series/add")
async def add_series(series: AddSeriesModel) -> JSONResponse:
    """Add a new main series"""
    try:
        from scripts.series_config import SERIES_OPTIONS, SERIES_METADATA
        
        series_name = series.series_name.strip()
        
        if not series_name:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Series name cannot be empty"}
            )
        
        if series_name in SERIES_OPTIONS:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": f"Series '{series_name}' already exists"}
            )
        
        # Add the new series
        SERIES_OPTIONS[series_name] = []
        
        # Add metadata if provided
        if series.description or series.price_range or series.rarity:
            SERIES_METADATA[series_name] = {
                "description": series.description or "No description available",
                "price_range": series.price_range or "Varies",
                "rarity": series.rarity or "Unknown"
            }
        else:
            # Add default metadata if none provided
            SERIES_METADATA[series_name] = {
                "description": "No description available",
                "price_range": "Varies",
                "rarity": "Unknown"
            }
        
        # Save to file
        if save_series_config():
            return JSONResponse(content={
                "success": True,
                "message": f"Series '{series_name}' added successfully!"
            })
        else:
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Failed to save configuration to file"}
            )
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