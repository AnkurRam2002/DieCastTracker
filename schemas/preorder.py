from pydantic import BaseModel
from typing import Optional

class PreorderModel(BaseModel):
    seller: str
    models: str
    eta: Optional[str] = None
    total_price: Optional[float] = None
    po_amount: Optional[float] = None
    on_arrival_amount: Optional[float] = None
    delivery_status: Optional[str] = "Pending"

class PreorderRead(PreorderModel):
    serial_number: int
    date_added: Optional[str] = None
