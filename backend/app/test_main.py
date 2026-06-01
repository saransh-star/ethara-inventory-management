import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .main import app, get_db
from .database import Base

# Setup an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate tables in the SQLite test DB
Base.metadata.create_all(bind=engine)

# Dependency override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Clean tables before each test
    db = TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db.close()
    yield

# ==================== PRODUCT TESTS ====================
def test_create_and_read_product():
    # Create product
    res = client.post("/products", json={
        "name": "Mechanical Keyboard",
        "sku": "KEY-MECH-01",
        "price": 129.99,
        "quantity_in_stock": 25
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Mechanical Keyboard"
    assert data["sku"] == "KEY-MECH-01"
    assert data["id"] is not None

    # Read products list
    res = client.get("/products")
    assert res.status_code == 200
    assert len(res.json()) == 1

def test_sku_uniqueness_collision():
    # Create product
    client.post("/products", json={
        "name": "Keyboard A",
        "sku": "KEY-01",
        "price": 50.00,
        "quantity_in_stock": 10
    })
    # Try duplicate SKU
    res = client.post("/products", json={
        "name": "Keyboard B",
        "sku": "KEY-01",
        "price": 60.00,
        "quantity_in_stock": 5
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def test_negative_values_rejected():
    # Negative price
    res = client.post("/products", json={
        "name": "Error Product",
        "sku": "ERR-01",
        "price": -10.00,
        "quantity_in_stock": 5
    })
    assert res.status_code == 422 # Unprocessable Entity validation error

    # Negative stock
    res = client.post("/products", json={
        "name": "Error Product",
        "sku": "ERR-02",
        "price": 10.00,
        "quantity_in_stock": -5
    })
    assert res.status_code == 422

# ==================== CUSTOMER TESTS ====================
def test_create_customer():
    res = client.post("/customers", json={
        "full_name": "Alice Smith",
        "email": "alice@gmail.com",
        "phone_number": "1234567890"
    })
    assert res.status_code == 201
    assert res.json()["full_name"] == "Alice Smith"

def test_customer_email_uniqueness():
    client.post("/customers", json={
        "full_name": "Alice Smith",
        "email": "alice@gmail.com",
        "phone_number": "123"
    })
    res = client.post("/customers", json={
        "full_name": "Bob Jones",
        "email": "alice@gmail.com",
        "phone_number": "456"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

# ==================== ORDER & STOCK DEPLOYMENT TESTS ====================
def test_order_creation_and_inventory_depletion():
    # 1. Setup product
    p_res = client.post("/products", json={
        "name": "Wireless Mouse",
        "sku": "MOUSE-WL-01",
        "price": 40.00,
        "quantity_in_stock": 10
    })
    prod_id = p_res.json()["id"]

    # 2. Setup customer
    c_res = client.post("/customers", json={
        "full_name": "John Doe",
        "email": "john@doe.com",
        "phone_number": "999"
    })
    cust_id = c_res.json()["id"]

    # 3. Create Order
    o_res = client.post("/orders", json={
        "customer_id": cust_id,
        "items": [
            {"product_id": prod_id, "quantity": 3}
        ]
    })
    assert o_res.status_code == 201
    order = o_res.json()
    # Check automatic price calculation
    assert order["total_amount"] == 120.00
    
    # 4. Check stock depletion in database
    p_check = client.get(f"/products/{prod_id}")
    assert p_check.json()["quantity_in_stock"] == 7

def test_insufficient_stock_raises_error():
    # Setup product with 2 stock
    p_res = client.post("/products", json={
        "name": "Rare Stamp",
        "sku": "STAMP-01",
        "price": 500.00,
        "quantity_in_stock": 2
    })
    prod_id = p_res.json()["id"]

    # Setup customer
    c_res = client.post("/customers", json={
        "full_name": "John Doe",
        "email": "john@doe.com",
        "phone_number": "999"
    })
    cust_id = c_res.json()["id"]

    # Try order with 3 quantity
    o_res = client.post("/orders", json={
        "customer_id": cust_id,
        "items": [
            {"product_id": prod_id, "quantity": 3}
        ]
    })
    assert o_res.status_code == 400
    assert "Insufficient stock" in o_res.json()["detail"]

def test_delete_order_restores_stock():
    # Setup product
    p_res = client.post("/products", json={
        "name": "Item A",
        "sku": "ITEM-A",
        "price": 10.00,
        "quantity_in_stock": 10
    })
    prod_id = p_res.json()["id"]

    # Setup customer
    c_res = client.post("/customers", json={
        "full_name": "John",
        "email": "john@doe.com",
        "phone_number": "9"
    })
    cust_id = c_res.json()["id"]

    # Place order for 4 items
    o_res = client.post("/orders", json={
        "customer_id": cust_id,
        "items": [
            {"product_id": prod_id, "quantity": 4}
        ]
    })
    order_id = o_res.json()["id"]

    # Verify stock dropped to 6
    p_check_1 = client.get(f"/products/{prod_id}")
    assert p_check_1.json()["quantity_in_stock"] == 6

    # Delete order
    del_res = client.delete(f"/orders/{order_id}")
    assert del_res.status_code == 200

    # Verify stock restored back to 10
    p_check_2 = client.get(f"/products/{prod_id}")
    assert p_check_2.json()["quantity_in_stock"] == 10
