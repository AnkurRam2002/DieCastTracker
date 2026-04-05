from fastapi import APIRouter, Depends, Cookie, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from db.session import get_db
from db.models import User
from schemas.auth import UserSignup, UserLogin, UserRead
from core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from core.exceptions import AppException

router = APIRouter(prefix="/auth", tags=["Authentication"])

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

@router.post("/signup")
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing:
        raise AppException("Username or email already registered")
        
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    return {"success": True, "message": "User registered successfully"}

@router.post("/login")
async def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise AppException("Invalid username or password", status_code=status.HTTP_401_UNAUTHORIZED)
        
    access_token = create_access_token(data={"sub": user.username})
    response.set_cookie(key="access_token", value=access_token, httponly=True, max_age=3600*24)
    return {"success": True, "message": "Login successful", "username": user.username}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"success": True, "message": "Logged out"}

@router.get("/me")
async def get_me(user: Optional[User] = Depends(get_current_user)):
    if not user:
        return {"success": False, "user": None}
    return {
        "success": True,
        "user": {
            "username": user.username,
            "email": user.email,
            "date_joined": str(user.date_joined)
        }
    }
