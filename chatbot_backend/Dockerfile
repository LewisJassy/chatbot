FROM python:3.12-slim

WORKDIR /app

# Install system dependencies including PostgreSQL development files and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    postgresql-client \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first (for better caching)
COPY requirements.txt .
# Use --no-cache-dir to reduce image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "python manage.py migrate && gunicorn chatbot_backend.wsgi:application --bind 0.0.0.0:8000"]