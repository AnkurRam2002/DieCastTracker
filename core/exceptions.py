from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette import status

class AppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code

class EntityNotFoundException(AppException):
    def __init__(self, entity_name: str, identifier: str):
        super().__init__(
            f"{entity_name} with identifier '{identifier}' not found",
            status.HTTP_404_NOT_FOUND
        )

class ExcelUpdateException(AppException):
    def __init__(self, details: str):
        super().__init__(
            f"Failed to update Excel file: {details}",
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )

async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.message}
    )

async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "An unexpected error occurred. Please contact support."}
    )
