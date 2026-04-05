from pydantic import BaseModel
from typing import Optional, List

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

class SeriesRead(BaseModel):
    name: str
    description: Optional[str] = None
    price_range: Optional[str] = None
    rarity: Optional[str] = None
    subseries: List[str] = []
