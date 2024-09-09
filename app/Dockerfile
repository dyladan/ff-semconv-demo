FROM node:20-alpine3.18
WORKDIR /tmp/demo/
COPY package*.json tsconfig*.json ./
RUN npm ci

COPY src/ ./src/
EXPOSE 3000

ENTRYPOINT ["node", "-r", "ts-node/register", "--require", "./src/instrumentation.ts", "./src/app.ts"]