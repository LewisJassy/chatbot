# Chatbot

This repository contains a chatbot application with a React frontend and a Django backend.

## Description

The Chatbot project is designed to provide a seamless and interactive experience to users through a conversational interface. The frontend is built using React, providing a dynamic and responsive user interface. The backend is developed using Django, handling the logic and processing of the chatbot's responses. The AI used for the chatbot is from Hugging Face, ensuring advanced natural language processing capabilities.

## How to Use

To get started with the Chatbot application, follow these steps:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/chatbot.git
    cd chatbot
    ```

2. **Install dependencies**:
    - For the frontend:
        ```bash
        cd chatbot
        npm install
        ```
    - For the backend:
        ```bash
        cd chatbot_backend
        ```

3. **Set up Hugging Face**:
    - Install the `transformers` library:
        ```bash
        pip install transformers
        ```
    - (Optional) If you need GPU support, install `torch`:
        ```bash
        pip install torch
        ```

4. **Run the application**:
    - Start the backend server:
        ```bash
        cd chatbot_backend
        python manage.py runserver
        ```
    - Start the frontend development server:
        ```bash
        cd chatbot
        npm run dev
        ```

5. **Access the application**:
    Open your web browser and navigate to `http://localhost:5173` to start interacting with the chatbot.