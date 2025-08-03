# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache curl netcat-openbsd

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD sh -c 'while ! nc -z $DB_HOST 5432; do echo "Waiting for PostgreSQL..."; sleep 2; done && npm start'