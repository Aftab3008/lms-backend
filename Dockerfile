# 1) Build stage
FROM node:lts-alpine3.21 AS builder
WORKDIR /usr/src/app

# install ALL deps
COPY package*.json ./
COPY .env ./
RUN npm ci

# copy source & compile
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npm run build

# 2) Production image
FROM node:lts-alpine3.21 AS runner
WORKDIR /usr/src/app

# only prod deps
COPY package*.json ./
RUN npm ci --only=production

# copy compiled output
COPY --from=builder /usr/src/app/dist ./dist

# copy env file from builder stage
COPY --from=builder /usr/src/app/.env .env

# run the built JS
CMD ["node", "dist/index.js"]
