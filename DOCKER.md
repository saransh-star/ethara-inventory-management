# Ethara.ai Backend API
### Production-Ready Containerized Inventory & Order Management System

This repository contains the containerized, enterprise-grade Python backend API engineered with **FastAPI** to power the Ethara.ai Inventory & Order Management System.

---

## 🌟 Key Features

* **Concurrency & Race Condition Prevention:** Employs row-level write locks (`SELECT ... FOR UPDATE`) in database transactions, preventing product stocks from falling below zero or double-allocating stock.
* **Automatic Pricing & Calculations:** Live pricing is retrieved from the database during checkout, preventing client-side spoofing, and totals are computed automatically.
* **Inventory Restoration:** Order cancellation/deletion automatically returns allocations to catalog stocks.
* **Data Validations:** Strong Pydantic schema validation enforcing unique product SKUs, unique customer email formats, and positive pricing/quantity constraints.
* **Slim Multi-Stage Build:** The Docker image utilizes a multi-stage production layout using a lightweight `python:3.11-slim` runner to minimize size and optimize start times.

---

## 🚀 How to Run Locally

### Pull the Image
```bash
docker pull saransh90/ethara-backend:latest
```

### Run the Container in Isolation
```bash
docker run -d -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/db" \
  saransh90/ethara-backend:latest
```

### Running with Docker Compose (Recommended)
This backend is designed to run seamlessly in orchestration with PostgreSQL and the React frontend client. Add this service block to your `docker-compose.yml`:

```yaml
services:
  backend:
    image: saransh90/ethara-backend:latest
    container_name: ethara-fastapi-backend
    restart: always
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/inventory
      CORS_ORIGINS: "*"
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
```
