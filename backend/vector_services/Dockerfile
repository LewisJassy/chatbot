# ############################
# # Stage 1 — Install deps   #
# ############################
# FROM python:3.12-slim-bullseye AS builder

# # Enable BuildKit cache for apt and pip
# WORKDIR /app

# # Install OS build tools
# RUN --mount=type=cache,target=/var/cache/apt \
#     apt-get update && \
#     apt-get install -y --no-install-recommends \
#       build-essential \
#       git \
#       curl \
#     && apt-get clean && \
#     rm -rf /var/lib/apt/lists/*
# # 
# # Upgrade pip
# RUN pip install --no-cache-dir --upgrade pip

# # Copy only requirements to leverage Docker layer cache
# COPY requirements.txt .

# # Use pip cache mount so wheels & build artifacts persist across builds
# RUN --mount=type=cache,target=/root/.cache/pip \
#     pip install --no-cache-dir \
#       --extra-index-url https://download.pytorch.org/whl/cpu \
#       -r requirements.txt

# ############################
# # Stage 2 — Final image    #
# ############################
# FROM python:3.12-slim-bullseye

# WORKDIR /app

# # Copy installed packages & binaries from builder
# COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
# COPY --from=builder /usr/local/bin /usr/local/bin

# # Copy app code
# COPY . .

# EXPOSE 8002

# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
