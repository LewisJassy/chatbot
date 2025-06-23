# Builder stage
FROM python:3.12-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    libffi-dev \
    libssl-dev \
    build-essential \
    ca-certificates \
    pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Verify requirements.txt exists
RUN test -f requirements.txt || (echo "Requirements file missing" && exit 1)

# Create virtual environment and install dependencies
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --upgrade pip && \
    pip install --no-cache-dir wheel setuptools && \
    python3 -m pip install argon2_cffi && \
    pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.12-slim
WORKDIR /app

# Install only essential runtime libraries (updated for Debian Bookworm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libffi8 \
    libssl3 && \
    rm -rf /var/lib/apt/lists/*

# Copy virtual environment
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"
ENV VIRTUAL_ENV="/venv"

# Install argon2_cffi in final stage
RUN python3 -m pip install argon2_cffi

# Copy application code
COPY . .

EXPOSE 8000
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "Auth.asgi:application", "--host", "0.0.0.0", "--port", "8000"]
