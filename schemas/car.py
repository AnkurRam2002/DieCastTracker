from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class CarBase(BaseModel):
    model_name: str
    subseries: str
    series: str

class NewCarModel(BaseModel):
    model_name: str
    series: str
    subseries: str

class UpdateCarModel(BaseModel):
    serial_number: int
    updates: Dict[str, Any]

class DeleteCarModel(BaseModel):
    serial_number: int

class AddFieldModel(BaseModel):
    field_name: str

class CarRead(BaseModel):
    serial_number: int
    model_name: str
    subseries: str
    series: str
