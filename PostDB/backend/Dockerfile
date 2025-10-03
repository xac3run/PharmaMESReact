FROM node:20-slim AS builder

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходники
COPY . .

# Собираем NestJS в dist/
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Копируем результат сборки
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main.js"]
