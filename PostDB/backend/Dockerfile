# ==== Build Stage ====
FROM node:20-slim AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Ставим зависимости (только JS-пакеты, без python/g++)
RUN npm install

# Копируем исходники
COPY . .

# Собираем NestJS (в dist)
RUN npm run build


# ==== Production Stage ====
FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Устанавливаем только продакшн-зависимости
RUN npm install --omit=dev

# Копируем собранное приложение
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]
