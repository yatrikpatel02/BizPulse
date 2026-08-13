# Use official Node.js image
FROM node:20-slim

# Set work directory
WORKDIR /app

# Copy dependency configs
COPY package*.json /app/

# Install dependencies
RUN npm install

# Copy project files
COPY . /app/

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server with host binding so it's accessible externally
CMD ["npm", "run", "dev", "--", "--host"]
