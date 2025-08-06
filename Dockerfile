FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm install

ENV CI=true
COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=8082
ENV HOSTNAME=0.0.0.0

EXPOSE 8082

# Use your new server.js
CMD ["node", "server.js"]
