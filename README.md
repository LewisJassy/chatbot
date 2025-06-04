# Chatbot

This repository contains a chatbot application with a React frontend and a Django/FastAPI backend.

## Project Structure

- `backend/`: Contains all backend services (Django, FastAPI, vector services, Redis, etc.)
- `chatbot-frontend/`: Contains the React frontend application

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for frontend)
- [Python 3.10+](https://www.python.org/) (for backend)
- [Docker](https://www.docker.com/) (optional, for containerized setup)

---

## Running the Application

### 1. Backend Setup

#### a. Using Docker (Recommended)
1. Navigate to the `backend/` directory:
   ```sh
   cd backend
   ```
2. Start all backend services:
   ```sh
   docker-compose up --build
   ```

#### b. Manual Setup
1. Create and activate a Python virtual environment in each backend submodule as needed (e.g., `Auth/`, `chatbot/`, `chatbot_history/`, `vector_services/`).
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Run the Django server (from `Auth/`):
   ```sh
   python manage.py runserver
   ```
4. Run FastAPI and other services as needed (see respective subfolders for details).

---

### 2. Frontend Setup

1. Navigate to the `chatbot-frontend/` directory:
   ```sh
   cd chatbot-frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

---

## Usage
- Access the frontend at [http://localhost:5173](http://localhost:5173) (or as indicated in the terminal)
- The frontend communicates with the backend services for authentication and chatbot responses

---

## Notes
- Ensure backend services are running before starting the frontend.
- For production, use Docker or set up environment variables and secure settings as needed.
- See each subdirectory's README or documentation for advanced configuration.

---

## Tech Stack
- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Django, FastAPI, Redis, RabbitMQ, OpenAI, Redis

---

## License
MIT
