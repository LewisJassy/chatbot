# Stage 1: Build dependencies
FROM python:3.12 AS builder

WORKDIR /deps

# Copy requirements in order of least likely to change
COPY ./Auth/requirements.txt ./auth_requirements.txt
COPY ./chatbot/requirements.txt ./chatbot_requirements.txt
COPY ./chatbot_history/requirements.txt ./chatbot_history_requirements.txt
COPY ./vector_services/requirements.txt ./vector_requirements.txt

# Combine and deduplicate requirements
RUN cat auth_requirements.txt chatbot_requirements.txt chatbot_history_requirements.txt vector_requirements.txt | sort -u > all_requirements.txt

# Use BuildKit cache for pip (retains downloaded packages between builds)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip wheel --wheel-dir /wheels -r all_requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim-bullseye

WORKDIR /app

# Install runtime dependencies only (no build tools)
RUN apt-get update && apt-get install -y \
    supervisor \
    libpq-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/log/supervisor

# Install prebuilt wheels
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/*

# Copy application code
COPY ./Auth /app/Auth
COPY ./chatbot /app/chatbot
COPY ./chatbot_history /app/chatbot_history
COPY ./vector_services /app/vector_services

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8000 8001 8002 8003
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]