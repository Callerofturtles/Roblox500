FROM node:18-alpine
WORKDIR /app

# Install dependencies first to leverage Docker cache
COPY package*.json ./
RUN npm ci --only=production

# Copy app sources
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Run via npm start so prestart runs and ensures deps are installed in all start flows
CMD ["npm", "start"]
