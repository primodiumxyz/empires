# Empires: Keeper

A minimal Typescript keeper to call a function on a contract whenever a condition is met, by verifying the condition frequently off-chain.

The built image is available on [ghcr.io/primodiumxyz/empires-keeper](https://github.com/orgs/primodiumxyz/packages/container/package/empires-keeper), for direct usage inside a containerized environment.

## Setup

Follow the [README](../../README.md) in the root of the monorepo to install the necessary dependencies and configure the environment.

## Configuration

Make sure to set the following environment variables in the root [`.env`](../../.env) file:

| Variable              | Description                                                          | Default                                                                                  |
| --------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `KEEPER_HOST`         | Host that the keeper server listens on                               | `0.0.0.0`                                                                                |
| `KEEPER_PORT`         | Port that the keeper server listens on                               | `3002`                                                                                   |
| `KEEPER_PRIVATE_KEY`  | Private key of wallet to run the (possibly restricted) function from | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` (Anvil default key) |
| `KEEPER_BEARER_TOKEN` | Bearer token to gatekeep keeper start/stop in production             |                                                                                          |

## Running the keeper

### In development

```bash
pnpm start
# or from root, provided that the backend is running
pnpm dev:keeper
```

### Docker

You can use the published image from [ghcr.io/primodiumxyz/empires-keeper](https://github.com/orgs/primodiumxyz/packages/container/package/empires-keeper) to run the keeper in a containerized environment. An example of a `docker-compose.yml` would be:

```yaml
version: "3.8"

services:
  empires-keeper:
    image: ghcr.io/primodiumxyz/empires-keeper:main
    restart: always
    platform: linux/amd64
    environment:
      DEBUG: mud:*
      KEEPER_HOST: 0.0.0.0
      KEEPER_PORT: 3002
      KEEPER_PRIVATE_KEY: <your_private_key>
      KEEPER_BEARER_TOKEN: <your_bearer_token>
    ports:
      - "3002:3002"
    command: pnpm start
```

## API

The keeper exposes restricted endpoints that can be used to start and stop the keeper.

### Start

```bash
curl -X POST 'http://localhost:3002/trpc/start' \
-H 'Authorization: Bearer <keeper_bearer_token>' \
-H 'Content-Type: application/json' \
-d '{
  "chainId": "<chain_id>",
  "worldAddress": "<world_address>",
  "initialBlockNumber": "<initial_block_number>"
}'
```

### Stop

```bash
curl -X POST 'http://localhost:3002/trpc/stop' \
-H 'Authorization: Bearer <keeper_bearer_token>'
```

### Get status

```bash
curl 'http://localhost:3002/trpc/getStatus' \
-H 'Authorization: Bearer <keeper_bearer_token>'
```
