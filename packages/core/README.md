# Primodium Core

Primodium Core exposes core functionality to [Primodium: Empires](empires.primodium.com). This includes:

- The Core object, which contains
  - Tables, allowing user to access and update functionality. [See here](https://github.com/primodiumxyz/reactive-tables) for more details.
  - Network, an object that handles connection to the blockchain running Primodium.
  - Utils, a suite of tools that allow for ease of getting and setting data
  - Sync, a suite of tools for fetching data from an indexer
- Hooks, which expose a set of hooks for React-based use cases
- Constants and Mappings, used throughout the core package for type safety and developer experience.

This package is available as a [npm package](https://www.npmjs.com/package/@primodiumxyz/core).

## Getting Started

### Documentation

You can find details about Primodium and ways to develop on top at [developer.primodium.com](developer.primodium.com).

### Prerequisites

- [node 18.x](https://nodejs.org/en/download/)
- [pnpm](https://pnpm.io/installation)

### Installation

```
pnpm install @primodiumxyz/core
```

Or if you're using the whole monorepo, install by following the [README](../../README.md) in the root of the monorepo.

## Usage

### Node

```js
import { createCore, chainConfigs } from "@primodiumxyz/core";

const coreConfig = {
  chain: chainConfigs.dev,
  worldAddress: "0x0",
  initialBlockNumber: BigInt(0),
  runSync: true, // runs default sync process if indexer url provided in chain config
  runSystems: true, // runs default systems to keep core table data updated as blockchain state changes
};

const core = createCore(coreConfig);

const time = core.components.Time.get()?.value;
```

### React

```js
import { createCore, chainConfigs } from "@primodiumxyz/core";
import { CoreProvider, AccountClientProvider, useCore, useAccountClient } from "@primodiumxyz/core/react";

const App = () => {
  const core = createCore(coreConfig);
  const privateKey = <PRIVATE_KEY>

  // AccountClientProvider must be defined within the core context
  return (
    <CoreProvider {...core}>
      <AccountClientProvider playerPrivateKey={privateKey} sessionPrivateKey={privateKey}>
        <Content />
      </AccountClientProvider>
    </CoreProvider>
  );
};

const Content = () => {
  const core = useCore();
  const account = useAccountClient();

  return (
    <div>
      {account.playerAccount.address}
    </div>
  )
}

```
