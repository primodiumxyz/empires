FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copy root package.json, pnpm-workspace.yaml, and pnpm-lock.yaml
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

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