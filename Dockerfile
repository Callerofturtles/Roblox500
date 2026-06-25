FROM node:18-bullseye-slim
WORKDIR /app

# Install build tools needed for some native modules during npm install
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 && rm -rf /var/lib/apt/lists/*

# Install dependencies (uses package.json/package-lock.json)
COPY package*.json ./
RUN npm ci --production

# Copy app sources
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Run via npm start so prestart/start lifecycle runs if present
CMD ["npm", "start"]
