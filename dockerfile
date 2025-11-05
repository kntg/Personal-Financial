FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY public/ ./
COPY src/ ./src/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
