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
from typing import List, Dict, Any, Optional
import uvicorn
from openpyxl import load_workbook
import sys
import json
from collections import Counter
from datetime import datetime
from dotenv import load_dotenv

# Add paths for page-specific logic
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'series-management'))
from series_config import SERIES_OPTIONS, SERIES_METADATA, get_all_series, get_subseries, get_series_info
from utils.database import SessionLocal, Car, Subseries, Series, Preorder, User, init_db, get_db
from utils.auth import get_password_hash, verify_password, create_access_token, decode_access_token
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from fastapi import Depends, Cookie

# Load environment variables
load_dotenv()

# Initialize database (create tables if they don't exist)
init_db()

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
SERIES_CONFIG_PATH = os.path.join("pages", "series-management", "series_config.py")

# save_series_config is now in pages/series-management/manage_series.py

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

# Data model for preorders
class PreorderModel(BaseModel):
    seller: str
    models: str
    eta: Optional[str] = None
    total_price: Optional[float] = None
    po_amount: Optional[float] = None
    on_arrival_amount: Optional[float] = None
    delivery_status: Optional[str] = "Pending"

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

class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str


def load_excel_data() -> pd.DataFrame:
    """Load data from the Excel file"""
    try:
        if os.path.exists(EXCEL_FILE_PATH):
            df = pd.read_excel(EXCEL_FILE_PATH)
            # Convert NaN values to empty strings for better JSON serialization
            df = df.fillna("")
            return df
        else:
            # Create empty df with expected columns if file doesn't exist
            return pd.DataFrame(columns=["S.No", "Model Name", "Series", "Main Series"])
    except Exception as e:
        print(f"Error loading Excel file: {str(e)}")
        return pd.DataFrame(columns=["S.No", "Model Name", "Series", "Main Series"])

async def get_current_user(access_token: Optional[str] = Cookie(None), db: Session = Depends(get_db)):
    if not access_token:
        return None
    
    payload = decode_access_token(access_token)
    if not payload:
        return None
    
    username: str = payload.get("sub")
    if username is None:
        return None
    
    user = db.query(User).filter(User.username == username).first()
    return user

@app.get("/", response_class=HTMLResponse)
async def home(request: Request, user: User = Depends(get_current_user)):
    """Home page with the data table"""
    return templates.TemplateResponse("home/home.html", {"request": request, "user": user})

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Login page"""
    return templates.TemplateResponse("auth/login.html", {"request": request})

@app.get("/signup", response_class=HTMLResponse)
async def signup_page(request: Request):
    """Signup page"""
    return templates.TemplateResponse("auth/signup.html", {"request": request})

@app.post("/api/signup")
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter((User.username == user_data.username) | (User.email == user_data.email)).first()
    if existing_user:
        return JSONResponse(status_code=400, content={"success": False, "error": "Username or email already registered"})
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return JSONResponse(content={"success": True, "message": "User registered successfully"})

@app.post("/api/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid username or password"})
    
    access_token = create_access_token(data={"sub": user.username})
    response = JSONResponse(content={"success": True, "message": "Login successful"})
    response.set_cookie(key="access_token", value=access_token, httponly=True, max_age=3600*24)
    return response

@app.get("/logout")
async def logout():
    response = JSONResponse(content={"success": True, "message": "Logged out"})
    response.delete_cookie("access_token")
    # Redirect to home
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/", status_code=302)

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
    """Get all data as JSON (Database preferred, Excel fallback)"""
    try:
        # Try Database first
        db = SessionLocal()
        try:
            # Query cars with joined subseries and series, ordered by serial number
            cars = db.query(Car).join(Subseries).join(Series).order_by(Car.serial_number).all()
            if cars:
                data = []
                for car in cars:
                    data.append({
                        "S.No": car.serial_number,
                        "Model Name": car.model_name,
                        "Series": car.subseries.name if car.subseries else "",
                        "Main Series": car.subseries.series.name if car.subseries and car.subseries.series else ""
                    })
                
                columns = ["S.No", "Model Name", "Series"]
                total_records = len(data)
                
                return JSONResponse(content={
                    "success": True,
                    "data": data,
                    "columns": columns,
                    "total_records": total_records,
                    "message": f"Successfully loaded {total_records} records from database"
                })
        except Exception as db_err:
            print(f"Database read error, falling back to Excel: {db_err}")
        finally:
            db.close()

        # Fallback to Excel
        df = load_excel_data()
        data = df.to_dict('records')
        columns = df.columns.tolist()
        total_records = len(df)
        
        return JSONResponse(content={
            "success": True,
            "data": data,
            "columns": columns,
            "total_records": total_records,
            "message": f"Successfully loaded {total_records} records from Excel (Fallback)"
        })
    
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
    """Get collection statistics (Database preferred)"""
    try:
        db = SessionLocal()
        try:
            # Get stats from database
            total_models = db.query(Car).count()
            
            # Series breakdown
            series_counts = db.query(Series.name, db.func.count(Car.serial_number)).\
                join(Subseries, Series.id == Subseries.series_id).\
                join(Car, Subseries.id == Car.subseries_id).\
                group_by(Series.name).all()
            
            # Subseries breakdown
            subseries_counts = db.query(Subseries.name, db.func.count(Car.serial_number)).\
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
            return JSONResponse(content={"success": True, "stats": stats})
        except Exception as db_err:
            print(f"Database stats error: {db_err}")
        finally:
            db.close()

        # Fallback to Excel stats
        df = load_excel_data()
        stats = {
            "total_models": len(df),
            "column_info": {}
        }
        for col in df.columns:
            if df[col].dtype == 'object':
                unique_values = df[col].value_counts()
                stats["column_info"][col] = {
                    "type": "text",
                    "unique_values": len(unique_values),
                    "top_values": unique_values.head(5).to_dict() if len(unique_values) > 0 else {}
                }
        return JSONResponse(content={"success": True, "stats": stats})
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
    
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
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'add-model'))
        from add_model import add_model
        
        result = add_model(model.model_name, model.series, model.subseries)
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/search")
async def search_data(q: str = "") -> JSONResponse:
    """Search through the data (Database preferred)"""
    try:
        # Try Database first
        db = SessionLocal()
        try:
            search_query = f"%{q}%"
            # Search in model name or subseries name or series name
            cars = db.query(Car).join(Subseries).join(Series).\
                filter(
                    (Car.model_name.ilike(search_query)) | 
                    (Subseries.name.ilike(search_query)) | 
                    (Series.name.ilike(search_query))
                ).all()
            
            if cars:
                data = []
                for car in cars:
                    data.append({
                        "S.No": car.serial_number,
                        "Model Name": car.model_name,
                        "Series": car.subseries.name if car.subseries else "",
                        "Main Series": car.subseries.series.name if car.subseries and car.subseries.series else ""
                    })
                return JSONResponse(content={
                    "success": True,
                    "data": data,
                    "total_found": len(data),
                    "search_query": q,
                    "message": "Search results from database"
                })
        except Exception as db_err:
            print(f"Database search error: {db_err}")
        finally:
            db.close()

        # Fallback to Excel search
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'home'))
        from home import search_models
        data = search_models(q)
        return JSONResponse(content={
            "success": True,
            "data": data,
            "total_found": len(data),
            "search_query": q,
            "message": "Search results from Excel (Fallback)"
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
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'home'))
        from home import update_model as update_model_func
        
        update_model_func(model.serial_number, model.updates)
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
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'home'))
        from home import delete_model as delete_model_func
        
        delete_model_func(model.serial_number)
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
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'analytics'))
        from analytics import get_collection_statistics
        
        analytics = get_collection_statistics()
        return JSONResponse(content={
            "success": True,
            "analytics": analytics
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

# Preorders Routes
@app.get("/preorders", response_class=HTMLResponse)
async def preorders_page(request: Request):
    """Preorders management page"""
    return templates.TemplateResponse("preorders/preorders.html", {"request": request})

@app.get("/api/preorders")
async def get_preorders() -> JSONResponse:
    """Get all preorders as JSON (Database preferred)"""
    try:
        # Try Database first
        db = SessionLocal()
        try:
            preorders = db.query(Preorder).order_by(Preorder.serial_number).all()
            if preorders:
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
                return JSONResponse(content={
                    "success": True,
                    "data": data,
                    "total_records": len(data),
                    "message": f"Successfully loaded {len(data)} preorders from database"
                })
        except Exception as db_err:
            print(f"Database preorder read error: {db_err}")
        finally:
            db.close()

        # Fallback to Excel
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'preorders'))
        from preorders import load_preorders_data
        import math
        
        df = load_preorders_data()
        if df is None:
            return JSONResponse(content={"success": True, "data": [], "message": "No preorders found"})
        
        data = df.to_dict('records')
        # ... (cleaning logic omitted for brevity as DB is preferred, but keeping it as fallback)
        return JSONResponse(content={"success": True, "data": data, "message": "Successfully loaded preorders from Excel (Fallback)"})
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/preorders")
async def add_preorder_endpoint(preorder: PreorderModel) -> JSONResponse:
    """Add a new preorder"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'preorders'))
        from preorders import add_preorder as add_preorder_func
        
        result = add_preorder_func(
            preorder.seller,
            preorder.models,
            preorder.eta,
            preorder.total_price,
            preorder.po_amount,
            preorder.on_arrival_amount
        )
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.put("/api/preorders/{serial_number}")
async def update_preorder(serial_number: int, updates: dict) -> JSONResponse:
    """Update an existing preorder"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'preorders'))
        from preorders import update_preorder as update_preorder_func
        
        # Map frontend field names to Excel column names
        mapped_updates = {}
        field_mapping = {
            'seller': 'Seller',
            'models': 'Models',
            'eta': 'ETA',
            'total_price': 'Total Price',
            'po_amount': 'PO Amount',
            'on_arrival_amount': 'On Arrival Amount',
            'delivery_status': 'Delivery Status'
        }
        
        for key, value in updates.items():
            if key in field_mapping:
                mapped_updates[field_mapping[key]] = value
        
        update_preorder_func(serial_number, mapped_updates)
        return JSONResponse(content={
            "success": True,
            "message": f"Successfully updated preorder #{serial_number}!"
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.delete("/api/preorders/{serial_number}")
async def delete_preorder_endpoint(serial_number: int) -> JSONResponse:
    """Delete a preorder"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'preorders'))
        from preorders import delete_preorder as delete_preorder_func
        
        delete_preorder_func(serial_number)
        return JSONResponse(content={
            "success": True,
            "message": f"Successfully deleted preorder #{serial_number}!"
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/preorders/statistics")
async def get_preorders_statistics() -> JSONResponse:
    """Get preorders statistics"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'preorders'))
        from preorders import get_preorders_statistics
        
        stats = get_preorders_statistics()
        return JSONResponse(content={
            "success": True,
            "statistics": stats
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
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'series-management'))
        from manage_series import get_series_config
        
        config = get_series_config()
        return JSONResponse(content={
            "success": True,
            "series_options": config["series_options"],
            "series_metadata": config["series_metadata"]
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
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'add-field'))
        from add_field import add_field as add_field_func
        
        result = add_field_func(field.field_name)
        return JSONResponse(content=result)
        
    except Exception as e:
        error_msg = str(e)
        status_code = 400 if "already exists" in error_msg or "cannot be empty" in error_msg or "too long" in error_msg or "invalid characters" in error_msg else 500
        return JSONResponse(
            status_code=status_code,
            content={"success": False, "error": error_msg}
        )

@app.post("/api/series/update")
async def update_series_config(update: SeriesUpdateModel) -> JSONResponse:
    """Update series configuration"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'series-management'))
        from manage_series import add_subseries, remove_subseries
        
        if update.action == 'add':
            result = add_subseries(update.main_series, update.subseries)
            return JSONResponse(content=result)
        elif update.action == 'remove':
            result = remove_subseries(update.main_series, update.subseries)
            return JSONResponse(content=result)
        else:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Invalid action"}
            )
    except Exception as e:
        error_msg = str(e)
        status_code = 400 if "not found" in error_msg or "already exists" in error_msg else 500
        return JSONResponse(
            status_code=status_code,
            content={"success": False, "error": error_msg}
        )

@app.post("/api/series/rename")
async def rename_series(rename: RenameSeriesModel) -> JSONResponse:
    """Rename a main series"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'series-management'))
        from manage_series import rename_series as rename_series_func
        
        result = rename_series_func(rename.old_name, rename.new_name)
        return JSONResponse(content=result)
    except Exception as e:
        error_msg = str(e)
        status_code = 404 if "not found" in error_msg else 400 if "already exists" in error_msg else 500
        return JSONResponse(
            status_code=status_code,
            content={"success": False, "error": error_msg}
        )

@app.post("/api/series/rename-subseries")
async def rename_subseries(rename: RenameSubseriesModel) -> JSONResponse:
    """Rename a subseries"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'series-management'))
        from manage_series import rename_subseries as rename_subseries_func
        
        result = rename_subseries_func(rename.main_series, rename.old_name, rename.new_name)
        return JSONResponse(content=result)
    except Exception as e:
        error_msg = str(e)
        status_code = 404 if "not found" in error_msg else 400 if "already exists" in error_msg else 500
        return JSONResponse(
            status_code=status_code,
            content={"success": False, "error": error_msg}
        )

@app.post("/api/series/add")
async def add_series(series: AddSeriesModel) -> JSONResponse:
    """Add a new main series"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pages', 'series-management'))
        from manage_series import add_series as add_series_func
        
        result = add_series_func(series.series_name, series.description, series.price_range, series.rarity)
        return JSONResponse(content=result)
    except Exception as e:
        error_msg = str(e)
        status_code = 400 if "already exists" in error_msg or "cannot be empty" in error_msg else 500
        return JSONResponse(
            status_code=status_code,
            content={"success": False, "error": error_msg}
        )

@app.post("/api/series/metadata")
async def update_series_metadata(metadata: SeriesMetadataModel) -> JSONResponse:
    """Update series metadata"""
    try:
        # Metadata updates can be done by renaming or modifying series
        # This endpoint is kept for future implementation
        return JSONResponse(content={
            "success": False,
            "message": "Series metadata updates are handled through series rename operations."
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)