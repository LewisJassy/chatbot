# DeepSource AI Chatbot

A modern, enterprise-grade chatbot application featuring an intelligent AI assistant powered by cutting-edge technology. Built with a React frontend and a comprehensive microservices backend architecture.

## 🌟 Features

- **Intelligent Conversations**: AI-powered chatbot using GitHub's GPT-4.1 model
- **Real-time Messaging**: WebSocket support with streaming responses
- **Advanced Authentication**: JWT-based auth with Redis caching and session management
- **Vector Search**: Semantic similarity search using Pinecone vector database
- **Chat History**: Persistent conversation history with PostgreSQL storage
- **Responsive Design**: Modern UI with Tailwind CSS and smooth animations
- **Microservices Architecture**: Scalable backend with Docker containerization
- **Real-time Monitoring**: RabbitMQ message queuing and monitoring
- **Performance Optimized**: Redis caching, connection pooling, and efficient data handling

## 🏗️ Architecture

### Frontend

- **React 18.3** with modern hooks and function components
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, utility-first styling
- **Framer Motion** for smooth animations and transitions
- **React Router** for client-side navigation
- **Axios** with request/response interceptors for API communication
- **Real-time monitoring** with Datadog RUM integration

### Backend Services

#### 1. Authentication Service (`Auth/`) - Port 8000

- **Django REST Framework** with JWT authentication
- **Redis caching** for optimized user session management
- **Custom user model** with email-based authentication
- **Thread pool executor** for async token processing
- **Password reset** functionality with email support
- **PostgreSQL** for user data persistence

#### 2. Chatbot Service (`chatbot/`) - Port 8001

- **FastAPI** for high-performance async API
- **GitHub AI Models** integration (GPT-4.1)
- **LangChain** for AI conversation management
- **Redis** for chat history caching
- **RabbitMQ** for async message processing
- **Vector similarity search** integration

#### 3. Chat History Service (`chatbot_history/`) - Port 8003

- **FastAPI** for conversation persistence
- **PostgreSQL** for chat history storage
- **RabbitMQ consumer** for async history logging
- **Vector service integration** for chat upserting

#### 4. Vector Services (`vector_services/`) - Port 8002

- **FastAPI** with **Pinecone** vector database
- **Sentence Transformers** for text embeddings
- **Semantic similarity search** capabilities
- **Text preprocessing** with spaCy NLP
- **Context-aware** search results

### Infrastructure

- **PostgreSQL 17** - Primary database
- **Redis Stack** - Caching and session management
- **RabbitMQ** - Message queuing and async processing
- **Docker & Docker Compose** - Containerization
- **Supervisor** - Process management
- **Nginx** - Reverse proxy (production)

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** (for frontend)
- **Python 3.12+** (for backend)
- **Docker & Docker Compose** (recommended)
- **Git** for version control

### 1. Clone Repository

```bash
git clone <repository-url>
cd chatbot
```

### 2. Backend Setup (Docker - Recommended)

```bash
# Navigate to backend directory
cd backend

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration

# Start all backend services
docker-compose up --build
```

**Services will be available at:**

- Authentication: <http://localhost:8000>
- Chatbot API: <http://localhost:8001>
- History Service: <http://localhost:8003>
- Vector Service: <http://localhost:8002>
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd chatbot-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **<http://localhost:5173>**

### 4. Manual Backend Setup (Alternative)

If you prefer running services individually:

```bash
# For each service directory (Auth/, chatbot/, chatbot_history/, vector_services/)
cd backend/[service-name]

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
# For Django (Auth service):
python manage.py migrate
python manage.py runserver

# For FastAPI services:
uvicorn main:app --reload --port [service-port]
```

## 📱 Usage

1. **Access the Application**: Open <http://localhost:5173>
2. **Register/Login**: Create an account or sign in
3. **Start Chatting**: Begin conversations with the AI assistant
4. **Features Available**:
   - Real-time messaging with streaming responses
   - Message editing and copying
   - Chat history persistence
   - Responsive mobile-friendly interface
   - Dark/light theme support

## 🛠️ Development

### Frontend Development

```bash
cd chatbot-frontend

# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Development

```bash
# Run with auto-reload
uvicorn main:app --reload --port 8001

# Run tests
python -m pytest

# Database migrations (Django)
python manage.py makemigrations
python manage.py migrate
```

### Environment Configuration

Create `.env` files in respective directories:

**Backend (.env):**

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=chatbot_db

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
GITHUB_TOKEN=your_github_token
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=your_pinecone_environment

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
```

## 🔧 Tech Stack

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.3.1 |
| Vite | Build Tool | 6.1.0 |
| Tailwind CSS | Styling | 3.4.17 |
| React Router | Navigation | 7.1.5 |
| Framer Motion | Animations | 12.4.2 |
| Axios | HTTP Client | 1.7.9 |
| Lucide React | Icons | 0.475.0 |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Django | Auth Framework | 5.2 |
| FastAPI | API Framework | 0.110.2 |
| PostgreSQL | Database | 17 |
| Redis | Caching | Latest |
| RabbitMQ | Message Queue | 3-management |
| LangChain | AI Framework | Latest |
| Pinecone | Vector DB | 6.0.0+ |

### AI & ML

- **GitHub AI Models** (GPT-4.1)
- **Sentence Transformers** for embeddings
- **spaCy** for NLP preprocessing
- **LangChain** for conversation management

## 📊 API Documentation

### Authentication Endpoints

- `POST /auth/register/` - User registration
- `POST /auth/login/` - User login
- `GET /auth/status/` - Check auth status
- `POST /auth/logout/` - User logout
- `POST /auth/token/refresh/` - Refresh JWT token

### Chat Endpoints

- `POST /api/chat/` - Send message to chatbot
- `GET /api/chat/history/` - Get chat history

### Vector Search Endpoints

- `POST /similarity-search/` - Semantic similarity search
- `POST /upsert-history/` - Store chat for vector search

## 🚀 Deployment

### Docker Production Deployment

```bash
# Build all services
docker-compose -f docker-compose.prod.yml up --build

# Scale services
docker-compose up --scale chatbot-service=3
```

### Environment Setup for Production

- Configure environment variables for production
- Set up SSL certificates
- Configure Nginx reverse proxy
- Set up monitoring and logging
- Configure backup strategies for PostgreSQL

## 📝 Version

Current Version: **1.3.6**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Project Documentation](./document.md)
- [Authentication Guide](./backend/Auth/AUTHENTICATION.md)
- [GitHub Setup Guide](./GITHUB_SETUP.md)
- [Versioning Guide](./VERSIONING.md)

---

Built with ❤️ by the DeepSource Team
