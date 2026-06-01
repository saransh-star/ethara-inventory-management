from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, crud
from .database import engine, get_db
from .config import settings

# Automatically create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Production-Ready Python API backing the Inventory & Order Management System",
    version="1.0.0"
)

# CORS Configuration
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")] if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def read_root():
    return {
        "status": "online",
        "message": "Inventory & Order Management API is active and ready",
        "docs_url": "/docs"
    }

# ==================== PRODUCT ENDPOINTS ====================
@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Check for duplicate SKU
    existing = crud.get_product_by_sku(db, product.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    return crud.create_product(db, product)

@app.get("/products", response_model=List[schemas.ProductResponse], tags=["Products"])
def list_products(db: Session = Depends(get_db)):
    return crud.get_products(db)

@app.get("/products/{id}", response_model=schemas.ProductResponse, tags=["Products"])
def get_product(id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    return db_product

@app.put("/products/{id}", response_model=schemas.ProductResponse, tags=["Products"])
def update_product(id: int, product_data: schemas.ProductUpdate, db: Session = Depends(get_db)):
    # Verify product exists
    db_product = crud.get_product(db, id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )

    # Check for SKU conflict with other products
    existing = crud.get_product_by_sku(db, product_data.sku)
    if existing and existing.id != id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product SKU '{product_data.sku}' is already taken by another product."
        )

    return crud.update_product(db, id, product_data)

@app.delete("/products/{id}", tags=["Products"])
def delete_product(id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    
    # We can check if product has active orders and optionally warn/restrict,
    # but cascade delete is configured. Let's execute.
    crud.delete_product(db, id)
    return {"message": f"Product with ID {id} has been successfully deleted."}


# ==================== CUSTOMER ENDPOINTS ====================
@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED, tags=["Customers"])
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    # Check for duplicate email
    existing = crud.get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )
    return crud.create_customer(db, customer)

@app.get("/customers", response_model=List[schemas.CustomerResponse], tags=["Customers"])
def list_customers(db: Session = Depends(get_db)):
    return crud.get_customers(db)

@app.get("/customers/{id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def get_customer(id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {id} not found."
        )
    return db_customer

@app.delete("/customers/{id}", tags=["Customers"])
def delete_customer(id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {id} not found."
        )
    crud.delete_customer(db, id)
    return {"message": f"Customer with ID {id} has been successfully deleted."}


# ==================== ORDER ENDPOINTS ====================
@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_order(db, order_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.get("/orders", response_model=List[schemas.OrderResponse], tags=["Orders"])
def list_orders(db: Session = Depends(get_db)):
    return crud.get_orders(db)

@app.get("/orders/{id}", response_model=schemas.OrderResponse, tags=["Orders"])
def get_order(id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
    return db_order

@app.delete("/orders/{id}", tags=["Orders"])
def delete_order(id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db, id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
    crud.delete_order(db, id)
    return {"message": f"Order with ID {id} has been successfully cancelled and stock restored."}


# ==================== DASHBOARD SUMMARY ====================
@app.get("/dashboard/summary", tags=["Analytics"])
def get_dashboard_summary(db: Session = Depends(get_db)):
    products = crud.get_products(db)
    customers = crud.get_customers(db)
    orders = crud.get_orders(db)

    # Calculate low stock list (quantity <= 5)
    low_stock = [p for p in products if p.quantity_in_stock <= 5]

    return {
        "total_products": len(products),
        "total_customers": len(customers),
        "total_orders": len(orders),
        "low_stock_products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "price": p.price,
                "quantity_in_stock": p.quantity_in_stock
            } for p in low_stock
        ]
    }
