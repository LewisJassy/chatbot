# Builder stage
FROM python:3.12-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libffi-dev \
    libssl-dev \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Verify requirements.txt exists and is not empty
RUN test -f requirements.txt && echo "Requirements file exists" || (echo "Requirements file missing" && exit 1)
RUN test -s requirements.txt && echo "Requirements file not empty" || (echo "Requirements file is empty" && exit 1)

# Add argon2-cffi if not present
RUN grep -q 'argon2-cffi' requirements.txt || echo 'argon2-cffi>=21.3.0' >> requirements.txt

# Create virtual environment and install dependencies
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --upgrade pip && \
    pip install --no-cache-dir wheel && \
    pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.12-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libffi7 \
    libssl3 && \
    rm -rf /var/lib/apt/lists/*

# Copy virtual environment
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"
ENV VIRTUAL_ENV="/venv"

# Copy application code
COPY . .

EXPOSE 8000
ENV PYTHONUNBUFFERED=1

CMD ["gunicorn", "Auth.wsgi:application", "--bind", "0.0.0.0:8000"]