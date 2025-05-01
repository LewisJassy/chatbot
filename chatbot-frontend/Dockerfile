FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Install 'serve' to serve static files
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Serve the build directory
CMD ["serve", "-s", "dist", "-l", "3000"]
