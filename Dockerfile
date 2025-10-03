# Используем Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Открываем порт
EXPOSE 5173

# Запускаем dev сервер
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
