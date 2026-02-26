#!/usr/bin/env python3
"""
DieCastTracker - Database Utility
SQLAlchemy models and session management for PostgreSQL/SQLite
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL from environment variable
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./data/diecast_tracker.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DATABASE_URL}")
