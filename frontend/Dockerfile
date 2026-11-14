FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5175

# TODO 1: Bind the dev server host so it is reachable outside the container network
CMD ["npm", "run", "dev", "--", "--host", "<TODO_BIND_IP>"]