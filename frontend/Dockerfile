# ==================== BUILD STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install packages
RUN npm install --legacy-peer-deps

# Copy codebase
COPY . .

# Set default API URL build argument
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Compile assets
RUN npm run build


# ==================== RUNTIME STAGE ====================
FROM nginx:1.25-alpine AS runner

# Copy compiled assets to Nginx server directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support Single Page Application (SPA) routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
