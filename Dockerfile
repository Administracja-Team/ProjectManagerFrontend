# Стадия 1: Сборка приложения
FROM node:20-slim AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production=false

# Копируем весь код приложения
COPY . .

# Выполняем сборку приложения
RUN npm run build

# Стадия 2: Настройка Nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем собранные файлы из стадии сборки
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию Nginx (опционально, если нужна кастомизация)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]