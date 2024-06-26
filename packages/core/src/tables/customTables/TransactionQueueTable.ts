import { useEffect, useState } from "react";
import { BaseTableMetadata, createLocalTable, Entity, TableOptions, Type } from "@primodiumxyz/reactive-tables";
import { CreateNetworkResult } from "@/lib/types";
import { TxQueueOptions } from "@/tables/types";

export function createTransactionQueueTable<M extends BaseTableMetadata = BaseTableMetadata>(
  { world }: CreateNetworkResult,
  options?: TableOptions<M>
) {
  const queue: { id: string; fn: () => Promise<void> }[] = [];
  let isRunning = false;

  const table = createLocalTable(
    world,
    {
      metadata: Type.OptionalString,
      type: Type.OptionalString,
    },
    options
  );

  // Add a function to the queue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function enqueue(fn: () => Promise<any>, options: TxQueueOptions) {
    if (!options.force && table.has(options.id as Entity)) return;

    queue.push({
      id: options.id,
      fn,
    });

    table.set(
      {
        metadata: JSON.stringify(options?.metadata),
        type: options.type,
      },
      options.id as Entity
    );

    await run();
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
          await fn();
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
