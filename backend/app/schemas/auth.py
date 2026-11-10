from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Password must be at least 8 characters")
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    first_name: str
    last_name: str
    full_name: str
    is_active: bool
    department_id: Optional[UUID] = None
    avatar_gender: Optional[str] = "auto"
    avatar_config: Optional[Dict[str, Any]] = None
    bio: Optional[str] = None
    roles: List[RoleResponse]


class UserProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_gender: Optional[str] = Field(None, pattern="^(female|male|auto)$")
    avatar_config: Optional[Dict[str, Any]] = None
    bio: Optional[str] = Field(None, max_length=1000)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=16, description="Cryptographic password reset token")
    new_password: str = Field(..., min_length=8, description="New password meeting complexity requirements")


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, description="New password meeting complexity requirements")


class MsgResponse(BaseModel):
    message: str

