FROM node:20-alpine

RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate && npm run build
ENV PORT=4002
EXPOSE 4002

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
