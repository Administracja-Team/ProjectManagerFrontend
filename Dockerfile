# === Этап 1: сборка ===
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# === Этап 2: nginx + прокси ===
FROM nginx:stable-alpine AS production

# копируем собранный бандл
COPY --from=builder /app/dist /usr/share/nginx/html

# копируем кастомный конфиг
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
