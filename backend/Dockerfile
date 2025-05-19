# -------- Stage 1: Build dependencies --------
FROM python:3.12 AS builder
WORKDIR /deps

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        libssl-dev \
        libffi-dev && \
    rm -rf /var/lib/apt/lists/*

COPY ./Auth/requirements.txt ./requirements/auth.txt
COPY ./chatbot/requirements.txt ./requirements/chatbot.txt
COPY ./chatbot_history/requirements.txt ./requirements/history.txt

# Upgrade pip and download required wheels
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    # Install cryptography first to ensure it builds correctly
    pip install cryptography && \
    # Consolidate all requirements into all_requirements.txt
    echo "setuptools" > all_requirements.txt && \
    echo "wheel" >> all_requirements.txt && \
    cat requirements/*.txt | sort -u >> all_requirements.txt && \
    # Sort again to ensure uniqueness and proper merging
    sort -u -o all_requirements.txt all_requirements.txt && \
    # Download all packages and their dependencies specified in all_requirements.txt
    pip download --dest /wheels \
        setuptools \
        wheel \
        cryptography \
        cffi \
        pycparser \
        -r all_requirements.txt

# -------- Stage 2: Runtime --------
FROM python:3.12-slim-bullseye
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        supervisor \
        libpq-dev \
        gcc \
        libssl-dev \
        libffi-dev \
        libc6-dev \
        python3-dev && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/log/supervisor

# Install Python wheels using the cached directory
COPY --from=builder /wheels /wheels
COPY --from=builder /deps/all_requirements.txt /deps/all_requirements.txt

# Install cryptography directly from PyPI first, then the rest from wheels
RUN pip install cryptography && \
    # Install psycopg2-binary instead of psycopg2
    pip install psycopg2-binary && \
    pip install --no-cache-dir --find-links=/wheels -r /deps/all_requirements.txt && \
    # Clean up build dependencies after successful installation
    apt-get purge -y gcc && \
    apt-get autoremove -y && \
    apt-get clean

# Copy application code
COPY ./Auth ./Auth
COPY ./chatbot ./chatbot
COPY ./chatbot_history ./chatbot_history
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose app ports
EXPOSE 8000 8001 8003

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
