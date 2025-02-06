FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Update corepack to the latest version to avoid the signature keys issue
# https://github.com/pnpm/pnpm/issues/9029#issuecomment-2629817478
RUN npm install -g corepack@latest
RUN corepack enable
WORKDIR /app

# Copy root package.json, pnpm-workspace.yaml, and pnpm-lock.yaml
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# Copy .tsconfigs/bundler/dom/library-monorepo.json and reproduce correct path
COPY .tsconfigs/bundler/dom/library-monorepo.json /app/.tsconfigs/bundler/dom/library-monorepo.json

# Copy the keeper app
COPY apps/keeper ./apps/keeper

# Copy any shared packages
COPY packages ./packages

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Set working directory to the keeper app
WORKDIR /app/apps/keeper

# Expose the port the app runs on
EXPOSE 3002

# Command to run the keeper server
CMD ["pnpm", "start"]