FROM node:22.11.0-alpine

WORKDIR /app

COPY package*.json .
COPY src src/
COPY index.js index.js

RUN npm install && \
    npm cache clean --force

CMD [ "node", "index.js" ]