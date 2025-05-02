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
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

CMD serve -s dist -l 3000