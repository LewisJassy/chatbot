# Builder stage
FROM python:3.12-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libffi-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and inject necessary fixes
COPY requirements.txt ./
RUN sed -i 's/psycopg2==2.9.10/psycopg2-binary==2.9.10/' requirements.txt || true && \
    echo "argon2-cffi" >> requirements.txt && \
    pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
  
# Final stage
FROM python:3.12-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends libffi-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local /usr/local

# Copy application code
COPY . .

EXPOSE 8000
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir gunicorn

CMD ["gunicorn", "Auth.wsgi:application", "--bind", "0.0.0.0:8000"]
