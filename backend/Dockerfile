# Stage 1: Base
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

# Stage 2: Development
FROM base AS development

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# Stage 3: Builder
FROM base AS builder

RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --omit=dev

# Stage 4: Production
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main"]
