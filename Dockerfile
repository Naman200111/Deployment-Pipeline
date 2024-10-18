FROM node:20-alpine

RUN apk update
RUN apk add --no-cache git

WORKDIR /home/app

COPY build-server/package.json package.json
COPY build-server/package-lock.json package-lock.json
RUN npm install

COPY build-server/main.sh main.sh
COPY build-server/script.js script.js
COPY config.js config.js


RUN chmod +x main.sh
RUN chmod +x script.js

# ENTRYPOINT ["/bin/sh"] for running cmd while starting the container
ENTRYPOINT ["/home/app/main.sh"]
