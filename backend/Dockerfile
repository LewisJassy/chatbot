FROM python:3.12 AS builder
WORKDIR /deps

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        libssl-dev \
        libffi-dev && \
    rm -rf /var/lib/apt/lists/*

COPY ./Auth/requirements.txt ./requirements/auth.txt
COPY ./chatbot/requirements.txt ./requirements/chatbot.txt
COPY ./chatbot_history/requirements.txt ./requirements/history.txt

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install cryptography && \
    echo "setuptools==65.5.0" > all_requirements.txt && \
    echo "wheel" >> all_requirements.txt && \
    cat requirements/*.txt | sort -u >> all_requirements.txt && \
    sort -u -o all_requirements.txt all_requirements.txt && \
    pip download --dest /wheels \
        setuptools==65.5.0 \
        wheel \
        cryptography \
        cffi \
        pycparser \
        -r all_requirements.txt

FROM python:3.12-slim-bullseye
WORKDIR /app

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

COPY --from=builder /wheels /wheels
COPY --from=builder /deps/all_requirements.txt /deps/all_requirements.txt

RUN pip install cryptography && \
    pip install psycopg2-binary && \
    pip install --no-cache-dir --find-links=/wheels -r /deps/all_requirements.txt && \
    apt-get purge -y gcc && \
    apt-get autoremove -y && \
    apt-get clean

COPY ./Auth ./Auth
COPY ./chatbot ./chatbot
COPY ./chatbot_history ./chatbot_history
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8000 8001 8003

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
