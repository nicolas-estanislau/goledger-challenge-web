# 1. Base image
FROM node:20-alpine AS base

# 2. Dependencies stage
FROM base AS deps
WORKDIR /app

# Instala dependências do sistema (necessárias para algumas libs)
RUN apk add --no-cache libc6-compat

# Copia apenas arquivos de dependência
COPY package.json package-lock.json* ./

# Instala dependências (mais rápido e reprodutível)
RUN npm ci

# 3. Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build da aplicação
RUN npm run build

# 4. Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Cria usuário não-root (segurança)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copia apenas o necessário
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Usa usuário não-root
USER nextjs

# Porta padrão do Next.js
EXPOSE 3000

# Start da aplicação
CMD ["npm", "start"]