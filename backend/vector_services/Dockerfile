### --- Builder Stage ---
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | bash && \
    mv /root/.local/bin/uv /usr/local/bin/

# Copy requirements
COPY requirements.txt .

# Create virtual environment and install dependencies using uv
RUN uv venv && \
    uv pip install pip && \
    uv pip install --index-strategy unsafe-best-match \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

# Download spaCy model (requires pip to be present)
RUN .venv/bin/python -m spacy download en_core_web_sm

# Copy the rest of the project
COPY . .

### --- Final Stage ---
FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /app /app

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
