FROM node:12.20.1-alpine

COPY . /app

WORKDIR /app

RUN npm install

USER node

CMD npm start

