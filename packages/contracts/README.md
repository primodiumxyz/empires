# Empires: Contracts

The Solidity contracts that define all the game's state and conditions, as well as tests and prototypes configuration. The entire state is managed using MUD, which provides a convenient framework for indexing events emitted during state updates, and reconstructing the state of the game from a client.

## Table of Contents

- [Introduction](#introduction)
  - [Overview](#overview)
  - [Installation](#installation)
  - [Structure](#structure)
- [Development](#development)
  - [Building](#building)
  - [Testing](#testing)
- [Usage](#usage)
- [Deployment](#deployment)

## Introduction

### Overview

These contracts are separated into two main directories: [libraries](./src/libraries) and [systems](./src/systems). The libraries are used to define core logic that is used across systems, which are more opinionated and specific to a component of the game. The [adts](./src/adts) directory contains classes to conveniently manage the state of specific tables.

All of these get "compiled" into a [codegen](./src/codegen) directory, which is internally used for actually updating the game state.

The package also includes [TypeScript utilities for generating terrains, tables and prototypes](./ts).

The main entry point for the package is [mud.config.ts](./mud.config.ts), which houses the tables and world inputs, and it also exports [various constants, enums and prototype configurations](./config) for usage from other packages.

The actual configuration—applying the initial [prototype configuration](./config/prototypeConfig.ts) to the game state—is done in the [PostDeploy](./script/PostDeploy.s.sol) script, ran after the contracts are deployed.

### Installation

Follow the [README](../../README.md) in the root of the monorepo to install the necessary dependencies and configure the environment.

This package needs its own `.env` file for specifying the deployer's private key:

```bash
# From this directory:
# The default anvil private key
echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" >> .env
```

### Structure

```ml
audit - "Internal documents for preparing the contracts audit"
broadcast - "History of transactions ran from the scripts (ignored by git)"
cache - "Foundry cache (ignored by git)"
config - "Prototype and terrain configuration for initial game state"
deploys - "History of deployments (ignored by git)"
out - "Built ABIs for all systems (ignored by git)"
script - "Additional scripts for after-deployment setup"
src - "Source files"
├── adts - "Sets and maps for managing the state of specific tables"
├── codegen - "MUD-generated Solidity files"
├── libraries - "Core logic for the game"
└── systems - "Core logic applied to game systems"
test - "Test files"
ts - "TypeScript utilities for generating terrains, tables and prototypes"
```

## Development

### Building

To build the contracts, run:

```bash
pnpm build
```

This will run the following commands sequentially:

```bash
pnpm run build:lib # Generates source contracts in codegen and terrain
pnpm run build:mud # Generates prototypes and compiles contracts
pnpm run build:abi-ts # Generates TypeScript bindings for the contracts
```

### Testing

To test the contracts, run:

```bash
pnpm test
```

This will build the contracts and run the tests with MUD.

If you want to test a specific contract and skip build, you can run:

```bash
pnpm mud test --skipBuild --forgeOptions='--mc <contract_name>'
```

You can also run invariants tests with:

```bash
pnpm mud test:invariants
```

## Usage

Generally, you should refer directly to the [MUD documentation](https://mud.dev/introduction) for more information on how to modify the MUD config, add systems, etc.

You can directly add a system or library in their respective directories, and they will be included in the codegen in the next build.

For tables, you can directly add them in the [`mud.config.ts`](./mud.config.ts) file with their schema, and they will be available in the client with TypeScript bindings.

If this is a prototype table (`P_<table_name>`), you can add a prototype configuration (or settings) in the [`prototypeConfig.ts`](./config/prototypeConfig.ts) file, and it will be applied to the game state when the contracts are deployed.

A note during development; the `DevSystem` will expose direct table access. Meaning that you can directly modify the state for any table at a low level from the client. For instance:

```typescript
// To set some data on a table:
DevSystem.devSetRecord(tableId, key, data, valueSchema);
// To remove a record:
DevSystem.devDeleteRecord(tableId, key, valueSchema);
```

## Deployment

For deployment instructions, see the [README](../../README.md#deployment) in the root of the monorepo.
