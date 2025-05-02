# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Outputs to /app/dist

# Stage 2: Serve
FROM node:20-alpine
WORKDIR /app
# Install http-server globally (better for Vite)
RUN npm install -g http-server
COPY --from=builder /app/dist ./dist

CMD http-server dist -p 3000 --proxy http://localhost:3000?