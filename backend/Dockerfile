FROM python:3.12-slim-bullseye

WORKDIR /app

# Install supervisor for managing multiple processes
RUN apt-get update && apt-get install -y supervisor

# Create log directory for supervisor
RUN mkdir -p /var/log/supervisor

# Install dependencies for each service to leverage Docker cache
# Auth Service
COPY ./Auth/requirements.txt /app/Auth_requirements.txt
RUN apt-get update && apt-get install -y libpq-dev gcc

RUN pip install --no-cache-dir -r /app/Auth_requirements.txt

# Chatbot Service
COPY ./chatbot/requirements.txt /app/chatbot_requirements.txt
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && apt-get clean
RUN pip install --no-cache-dir -r /app/chatbot_requirements.txt

# Chatbot History Service
COPY ./chatbot_history/requirements.txt /app/chatbot_history_requirements.txt
RUN pip install --no-cache-dir -r /app/chatbot_history_requirements.txt

# Vector Services
COPY ./vector_services/requirements.txt /app/vector_services_requirements.txt
RUN pip install --no-cache-dir -r /app/vector_services_requirements.txt

# Copy all backend application code
COPY ./Auth /app/Auth
COPY ./chatbot /app/chatbot
COPY ./chatbot_history /app/chatbot_history
COPY ./vector_services /app/vector_services

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8000
EXPOSE 8001
EXPOSE 8002
EXPOSE 8003

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
