from fastapi import HTTPException, status
from typing import Any, Optional


class LearnflowException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: Optional[str] = None,
        headers: Optional[dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.code = code or "LEARNFLOW_ERROR"


class NotFoundException(LearnflowException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail, code="NOT_FOUND")


class ForbiddenException(LearnflowException):
    def __init__(self, detail: str = "Access denied: Insufficient permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail, code="FORBIDDEN")


class ConflictException(LearnflowException):
    def __init__(self, detail: str = "Conflict with current state"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail, code="CONFLICT")


class BadRequestException(LearnflowException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail, code="BAD_REQUEST")


class UnprocessableException(LearnflowException):
    def __init__(self, detail: str = "Unprocessable entity"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail, code="UNPROCESSABLE_ENTITY")

