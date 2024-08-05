import { sleep } from "@primodiumxyz/core";

export type QueuedCallback = () => void | Promise<void>;

export function createStaggerQueue() {
  const _queue: [QueuedCallback, number][] = [];
  let executing = false;

  async function enqueue(callback: QueuedCallback, duration = 100) {
    _queue.push([callback, duration]);
    await executeQueue();
  }

  async function executeQueue() {
    if (executing) return;
    await _executeQueue();
  }

  async function _executeQueue() {
    if (!_queue || _queue.length === 0) {
      executing = false;
      return;
    }
    executing = true;

    const cb = _queue.shift();
    if (!cb) throw new Error("Attempted to execute on empty queue");

    const [callback, duration] = cb;
    await callback();

    await sleep(duration);

    await _executeQueue();
  }

  return { enqueue };
}
