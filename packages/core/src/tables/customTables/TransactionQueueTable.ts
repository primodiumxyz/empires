import { useEffect, useState } from "react";
import { TransactionReceipt } from "viem";

import { BaseTableMetadata, createLocalTable, Entity, TableOptions, Type } from "@primodiumxyz/reactive-tables";
import { TX_TIMEOUT } from "@core/lib";
import { CreateNetworkResult } from "@core/lib/types";
import { TxQueueOptions } from "@core/tables/types";

export function createTransactionQueueTable<M extends BaseTableMetadata = BaseTableMetadata>(
  { world }: CreateNetworkResult,
  options?: TableOptions<M>,
) {
  const queue: { id: string; fn: () => Promise<TransactionReceipt | undefined> }[] = [];
  const txSuccess = new Map<string, boolean>();
  let isRunning = false;

  const table = createLocalTable(
    world,
    {
      metadata: Type.OptionalString,
      type: Type.OptionalString,
    },
    options,
  );

  // Add a function to the queue
  async function enqueue(fn: () => Promise<TransactionReceipt | undefined>, options: TxQueueOptions): Promise<boolean> {
    if (!options.force && table.has(options.id as Entity)) return waitForTx(options);

    queue.push({
      id: options.id,
      fn,
    });

    table.set(
      {
        metadata: JSON.stringify(options?.metadata),
        type: options.type,
      },
      options.id as Entity,
    );

    return waitForTx(options);
  }

  async function run() {
    if (isRunning) return;
    isRunning = true;

    while (queue.length) {
      const tx = queue[0];

      if (!tx) continue;

      const { id, fn } = tx;

      if (fn) {
        try {
          const receipt = await fn();
          if (receipt) {
            txSuccess.set(id, receipt.status === "success");
          }
        } catch (error) {
          console.error("Error executing function:", error);
        } finally {
          queue.shift();
          table.remove(id as Entity);
        }
      }
    }

    isRunning = false;
  }

  async function waitForTx(options: TxQueueOptions): Promise<boolean> {
    // listen to the table and resolve when it changes
    return new Promise<boolean>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Timed out"));
      }, options.timeout ?? TX_TIMEOUT);
      run();

      // TODO(TEMP): replace when reactive-tables merged & updated
      // table.once({
      //   filter: ({entity}) => entity === options.id,
      //   do: () => {
      //     clearTimeout(timeoutId);
      //     resolve(txSuccess.get(options.id) ?? false);
      //   }
      // });
      table.watch({
        onExit: ({ entity }) => {
          if (entity === options.id) {
            clearTimeout(timeoutId);
            resolve(txSuccess.get(options.id) ?? false);
          }
        },
      });
    });
  }

  function getIndex(id: string) {
    return queue.findIndex((item) => item.id === id);
  }

  function getSize() {
    return queue.length;
  }

  function getMetadata(id: string): object | undefined {
    const index = getIndex(id);
    if (index === -1) return undefined;
    return JSON.parse(table.get(id as Entity)?.metadata || "");
  }

  function useIndex(id: string) {
    const [position, setPosition] = useState<number>(getIndex(id));

    useEffect(() => {
      const sub = table.update$.subscribe(() => {
        const position = getIndex(id);
        setPosition(position);
      });

      return () => {
        sub.unsubscribe();
      };
    }, [id]);

    return position;
  }

  function useSize() {
    const [size, setSize] = useState<number>(getSize());

    useEffect(() => {
      const sub = table.update$.subscribe(() => {
        const size = getSize();
        setSize(size);
      });

      return () => {
        sub.unsubscribe();
      };
    }, []);

    return size;
  }

  return {
    ...table,
    enqueue,
    run,
    getIndex,
    useIndex,
    useSize,
    getSize,
    getMetadata,
  };
}
