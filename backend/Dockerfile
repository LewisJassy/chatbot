# -------- Stage 1: Build dependencies --------
FROM python:3.12 AS builder
WORKDIR /deps

COPY ./Auth/requirements.txt ./requirements/auth.txt
COPY ./chatbot/requirements.txt ./requirements/chatbot.txt
COPY ./chatbot_history/requirements.txt ./requirements/history.txt


# Add setuptools explicitly to the requirements
RUN --mount=type=cache,target=/root/.cache/pip \
    echo 'setuptools>=40.8.0' > requirements/setuptools.txt && \
    cat requirements/*.txt | sort -u > all_requirements.txt && \
    pip install --upgrade pip wheel && \
    pip download --dest /wheels -r all_requirements.txt

# -------- Stage 2: Runtime --------
FROM python:3.12-slim-bullseye
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends supervisor libpq-dev gcc libssl-dev libffi-dev && \
    apt-get purge -y gcc && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/log/supervisor

# Install Python wheels using cached directory
COPY --from=builder /wheels /wheels
COPY --from=builder /deps/all_requirements.txt /deps/all_requirements.txt
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r /deps/all_requirements.txt

# Copy application code
COPY ./Auth ./Auth
COPY ./chatbot ./chatbot
COPY ./chatbot_history ./chatbot_history
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8000 8001 8003
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
