# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app


COPY src/frontend/package*.json ./
RUN npm install


COPY src/frontend/ ./


RUN chmod +x node_modules/.bin/react-scripts


RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
