FROM node:18-bullseye

# Instala Chromium e dependências
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia código
COPY . .

EXPOSE 10000

CMD ["node", "index.js"]
