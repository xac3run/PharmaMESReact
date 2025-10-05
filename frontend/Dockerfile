# Используем Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app/

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Открываем порт
EXPOSE 5173

# Запускаем dev сервер
#ENV REACT_APP_API_URL=http://77.233.212.181:3001/api // for API shk
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
