FROM node:22-alpine AS builder

# Enable yarn berry
RUN corepack enable

WORKDIR /app

# Copy yarn setup and package metadata
COPY package.json yarn.lock .yarnrc.yml ./

# Install all dependencies (including dev tools required for build)
RUN yarn install --immutable

# Copy source code and configuration
COPY tsconfig.json ./
COPY src/ ./src/

# Compile the bot
RUN yarn build

# ---

FROM node:22-alpine

# Enable yarn berry
RUN corepack enable

WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Copy package metadata
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn workspaces focus --all --production || yarn install --immutable

# Copy built bundles from the builder
COPY --from=builder /app/dist ./dist/

# Launch the bot
CMD ["yarn", "start"]
