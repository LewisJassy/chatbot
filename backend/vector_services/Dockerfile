FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

RUN python -m spacy download en_core_web_sm

COPY . .


FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /app /app

# Copy only uvicorn binary
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# Copy Python packages
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--reload"]
