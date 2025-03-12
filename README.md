# Chatbot

A modern conversational interface powered by Cohere AI with a React frontend and Django backend.

![Chatbot Demo](https://via.placeholder.com/800x400?text=Chatbot+Demo)

## Overview

This repository contains a full-stack chatbot application that delivers an intelligent and responsive user experience through:

- **Frontend**: React-based UI with a clean, intuitive interface
- **Backend**: Django REST API handling business logic and integrations
- **AI Engine**: Cohere's natural language processing capabilities
- **Data Store**: Redis for efficient message caching and session management

## Features

- Real-time conversational interface
- Persistent chat history
- Advanced natural language understanding
- Responsive design for all devices
- Docker containerization for easy deployment

## Project Structure
```
chatbot/
├── chatbot-frontend/    # React application
├── chatbot_backend/     # Django application
│   ├── chatbot/         # Core Django settings
│   ├── core/            # Core application logic
│   ├── docker-compose.yml # Docker services configuration
│   ├── Dockerfile       # Django Dockerfile
│   └── requirements.txt
├── document.md          # Documentation
└── README.md
```

## Setup & Installation

### Prerequisites

- Node.js and npm
- Python 3.8+
- Docker and Docker Compose (recommended)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/chatbot.git
   cd chatbot
   ```

2. **Environment Configuration**:
   Create a `.env` file in the `chatbot_backend` directory:
   ```
   COHERE_API_KEY=your_cohere_api_key
   REDIS_HOST=redis
   REDIS_PORT=6379
   ```

3. **Docker Setup (Recommended)**:
   ```bash
   # Navigate to backend directory
   cd chatbot_backend
   
   # Build and start all services (Django, Redis)
   docker-compose build
   docker-compose up
   ```

4. **Manual Setup (Alternative)**:
   - Frontend:
     ```bash
     cd chatbot-frontend
     npm install
     npm run dev
     ```
   - Backend:
     ```bash
     cd chatbot_backend
     pip install -r requirements.txt
     python manage.py runserver
     ```

5. **Access the application**:
   - Backend API: `http://localhost:8000`
   - Frontend: `http://localhost:5173`

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│             │    │             │    │             │    │             │
│  React UI   │◄──►│  Django API │◄──►│  Redis Cache│◄──►│  Cohere AI  │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Redis Implementation

This project uses Redis through Docker for:
- Session management
- Message caching
- Rate limiting
- Real-time data processing

Redis is configured via the Docker Compose file with the following specifications:
- Using the lightweight Alpine-based Redis image
- Exposing port 6379 for Redis connections
- Persistent data storage through a named volume (`redis_data`)
- Accessible to the Django application via the `redis` hostname

## Docker Configuration

The project uses Docker Compose to orchestrate the following services:

### Django Service
```yaml
django:
  build: .
  container_name: chatbot_backend
  ports:
    - "8000:8000"
  volumes:
    - .:/app
  depends_on:
    - redis
  environment:
    - REDIS_HOST=redis
    - REDIS_PORT=6379
```

### Redis Service
```yaml
redis:
  image: redis:alpine
  container_name: redis-service
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```




