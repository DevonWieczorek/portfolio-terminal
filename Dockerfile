# Dockerfile

FROM node:20

WORKDIR /app

COPY package*.json ./

RUN yarn

COPY . .

RUN yarn run build

CMD ["yarn", "start"]
