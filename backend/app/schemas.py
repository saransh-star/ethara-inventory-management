from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime

# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    sku: str = Field(..., min_length=1, max_length=50, description="Unique SKU code")
    price: float = Field(..., ge=0.0, description="Price must be non-negative")
    quantity_in_stock: int = Field(..., ge=0, description="Quantity in stock must be non-negative")

    @field_validator('sku')
    @classmethod
    def clean_sku(cls, v: str) -> str:
        return v.strip().upper()

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

# ==================== CUSTOMER SCHEMAS ====================
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., description="Customer email address")
    phone_number: str = Field(..., min_length=1, max_length=20)

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v:
            raise ValueError("Invalid email format")
        return v

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True

# ==================== ORDER ITEM SCHEMAS ====================
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1, description="Quantity ordered must be at least 1")

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

# ==================== ORDER SCHEMAS ====================
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least 1 item")

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    created_at: datetime
    customer: CustomerResponse
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
