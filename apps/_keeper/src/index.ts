import {
  Core,
  CoreConfig,
  createCore,
  createLocalAccount,
  SyncStep,
} from '@primodiumxyz/core';
import net from 'net';
import { URL } from 'url';
import { getCoreConfig } from '@/getCoreConfig';
import { updateWorld } from '@/core/contractCalls/updateWorld';

async function run(config: CoreConfig) {
  const { core, deployerAccount } = await setup(config);

  let updating = false;
  core.tables.BlockNumber.watch({
    onChange: async ({ properties: { current } }) => {
      const ready = core.tables.Ready.get()?.value ?? false;
      const endBlock = core.tables.P_GameConfig.get()?.gameOverBlock ?? 0n;
      const blocksLeft = endBlock - (current?.value ?? 0n);
      const gameOver = blocksLeft <= 0n;
      if (!ready || gameOver) {
        console.info('SKIPPING: not ready or game over');
        return;
      }
      const txQueueSize = core.tables.TransactionQueue.getSize();

      if (txQueueSize > 0 || updating) {
        console.info('SKIPPING: transaction in progress');
        return;
      }

      const nextTurnBlock = core.tables.Turn.get()?.nextTurnBlock ?? 0n;
      if ((current?.value ?? 0n) < nextTurnBlock) {
        console.info(
          `SKIPPING: current block ${current?.value} next turn block ${nextTurnBlock}`,
        );
        return;
      }
      updating = true;
      await updateWorld(core, deployerAccount, () => {
        updating = false;
      });
    },
  });
}

async function setup(config: CoreConfig) {
  const core = createCore(config);
  const deployerKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!deployerKey) {
    throw new Error('PRIVATE_KEY is not set');
  }
  const deployerAccount = createLocalAccount(config, deployerKey);
  await awaitSync(core);
  return { core, deployerAccount };
}

function awaitSync(core: Core) {
  return new Promise((resolve) => {
    core.tables.SyncStatus.watch({
      onChange: ({ properties: { current } }) => {
        if (current?.step === SyncStep.Complete) {
          resolve(current);
        }
      },
    });
  });
}

async function checkPort(url: string): Promise<boolean> {
  const parsedUrl = new URL(url);
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(Number(parsedUrl.port) || 80, parsedUrl.hostname);
  });
}

async function main(config: CoreConfig) {
  const url = config.chain.rpcUrls.default?.http[0];
  console.log('url', config.chain.rpcUrls);
  if (!url) {
    throw new Error('RPC URL is not set');
  }
  console.log('Checking port for', url);
  const isPortOpen = await checkPort(url);

  if (isPortOpen) {
    await run(config);
  } else {
    console.log('Port is not open. Waiting to retry...');
    setTimeout(() => main(config), 5000); // Retry after 5 seconds
  }
}

const config = getCoreConfig();
main(config);
