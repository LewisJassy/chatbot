# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install  # or npm ci if you use a lockfile
COPY . .
<<<<<<< Updated upstream
RUN npm run build  # Should output to /app/dist
=======
RUN npm run build
>>>>>>> Stashed changes

# Stage 2: Serve
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
<<<<<<< Updated upstream
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:5173"]
=======
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
>>>>>>> Stashed changes
