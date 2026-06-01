# ==================== BUILDER STAGE ====================
FROM python:3.11-slim AS builder

WORKDIR /code

# Install compilation tools if any binary builds are required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into a wheels directory
RUN pip install --no-cache-dir --user -r requirements.txt


# ==================== RUNTIME STAGE ====================
FROM python:3.11-slim AS runner

WORKDIR /code

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
COPY . .

# Ensure local bin is in PATH
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Run API under Uvicorn server binding on host 0.0.0.0
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
