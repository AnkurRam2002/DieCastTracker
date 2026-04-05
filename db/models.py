from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    date_joined = Column(DateTime, default=datetime.utcnow)

class Series(Base):
    __tablename__ = "series"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    price_range = Column(String, nullable=True)
    rarity = Column(String, nullable=True)

    subseries = relationship("Subseries", back_populates="series", cascade="all, delete-orphan")

class Subseries(Base):
    __tablename__ = "subseries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    series_id = Column(Integer, ForeignKey("series.id"))

    series = relationship("Series", back_populates="subseries")
    cars = relationship("Car", back_populates="subseries", cascade="all, delete-orphan")

class Car(Base):
    __tablename__ = "cars"

    serial_number = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    subseries_id = Column(Integer, ForeignKey("subseries.id"))
    date_added = Column(DateTime, default=datetime.utcnow)

    subseries = relationship("Subseries", back_populates="cars")

class Preorder(Base):
    __tablename__ = "preorders"

    serial_number = Column(Integer, primary_key=True, index=True)
    seller = Column(String, index=True)
    models = Column(Text) # Detail of models in preorder
    eta = Column(String)  # Stored as YYYY-MM
    total_price = Column(Float, nullable=True)
    po_amount = Column(Float, nullable=True)
    on_arrival_amount = Column(Float, nullable=True)
    delivery_status = Column(String, default="Pending")
    date_added = Column(String) # Stored as YYYY-MM-DD
