FROM node:20-alpine

WORKDIR /app

COPY src/backend/package.json ./

RUN npm install

COPY src/backend/ ./

EXPOSE 5000

CMD ["npm", "start"]


