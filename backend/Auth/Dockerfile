# Builder stage
FROM python:3.12-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libffi-dev libssl-dev build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Patch psycopg2 and ensure argon2-cffi is present
RUN sed -i 's/psycopg2==2.9.10/psycopg2-binary==2.9.10/' requirements.txt || true && \
    grep -q 'argon2-cffi' requirements.txt || echo 'argon2-cffi' >> requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.12-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends libffi-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/root/.local/lib/python3.12/site-packages:$PYTHONPATH

# Copy app code
COPY . .

EXPOSE 8000
ENV PYTHONUNBUFFERED=1

# Install gunicorn separately in final image
RUN pip install --no-cache-dir gunicorn argon2-cffi

CMD ["gunicorn", "Auth.wsgi:application", "--bind", "0.0.0.0:8000"]
