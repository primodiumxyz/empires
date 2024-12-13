# keeper

A minimal Typescript keeper to call a function on a contract whenever a condition is met, by verifying the condition frequently off-chain.

## Usage

Install and run with:

```sh
pnpm keeper-server
```

## Configuration

The keeper can be configured with the following environment variables:

| Variable             | Description                                                          | Default                                                                                  |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `KEEPER_HOST`        | Host that the indexer server listens on                              | `0.0.0.0`                                                                                |
| `KEEPER_PORT`        | Port that the indexer server listens on                              | `3002`                                                                                   |
| `KEEPER_PRIVATE_KEY` | Private key of wallet to run the (possibly restricted) function from | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` (Anvil default key) |
