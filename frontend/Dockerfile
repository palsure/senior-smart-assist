FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port for Expo web
EXPOSE 19006

# Start Expo in web mode (use lan to bind to all interfaces)
CMD ["npx", "expo", "start", "--web", "--port", "19006", "--host", "lan"]
