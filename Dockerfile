FROM node:26-alpine

WORKDIR /usr/src/app

COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json

RUN npm install

COPY . /usr/src/app

RUN npx prisma migrate deploy 
RUN npx prisma generate

RUN npm run build
