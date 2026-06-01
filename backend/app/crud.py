from sqlalchemy.orm import Session
from sqlalchemy import select
from . import models, schemas

# ==================== PRODUCT CRUD ====================
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku.strip().upper()).first()

def get_products(db: Session):
    return db.query(models.Product).order_by(models.Product.id.asc()).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity_in_stock=product.quantity_in_stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_data: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    db_product.name = product_data.name
    db_product.sku = product_data.sku
    db_product.price = product_data.price
    db_product.quantity_in_stock = product_data.quantity_in_stock
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product

# ==================== CUSTOMER CRUD ====================
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email.strip().lower()).first()

def get_customers(db: Session):
    return db.query(models.Customer).order_by(models.Customer.id.asc()).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    db.delete(db_customer)
    db.commit()
    return db_customer

# ==================== ORDER CRUD (TRANSACTION SAFE) ====================
def get_orders(db: Session):
    return db.query(models.Order).order_by(models.Order.id.desc()).all()

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # 1. Verify customer exists
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise ValueError(f"Customer with ID {order_data.customer_id} does not exist.")

    # 2. Extract item details
    items_map = {item.product_id: item.quantity for item in order_data.items}
    product_ids = list(items_map.keys())

    # 3. Lock products to prevent race conditions using SELECT FOR UPDATE
    products = db.query(models.Product).filter(
        models.Product.id.in_(product_ids)
    ).with_for_update().all()

    # Verify that all products exist
    found_product_ids = {p.id for p in products}
    missing_ids = set(product_ids) - found_product_ids
    if missing_ids:
        raise ValueError(f"Products with IDs {list(missing_ids)} do not exist.")

    total_amount = 0.0
    order_items_to_create = []

    # 4. Perform stock validation & price calculations
    for product in products:
        qty_ordered = items_map[product.id]
        
        # Check stock availability
        if product.quantity_in_stock < qty_ordered:
            raise ValueError(
                f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                f"Available: {product.quantity_in_stock}, Ordered: {qty_ordered}."
            )
        
        # Calculate pricing details
        total_amount += product.price * qty_ordered
        
        # Decrement stock levels
        product.quantity_in_stock -= qty_ordered
        
        # Stage OrderItem rows
        order_item = models.OrderItem(
            product_id=product.id,
            quantity=qty_ordered
        )
        order_items_to_create.append(order_item)

    # 5. Save order records
    db_order = models.Order(
        customer_id=order_data.customer_id,
        total_amount=total_amount,
        items=order_items_to_create
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    # Lock the order to prevent race conditions during deletion
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        return None

    # Load and lock associated products to restore inventory safely
    for item in db_order.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).with_for_update().first()
        
        if product:
            product.quantity_in_stock += item.quantity

    db.delete(db_order)
    db.commit()
    return db_order
