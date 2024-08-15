import { sleep } from "@primodiumxyz/core";

export type QueuedCallback = () => void | Promise<void>;

export type StaggerQueue = ReturnType<typeof createStaggerQueue>;
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

    const queueLength = _queue.length;
    const speed = queueLength > 20 ? 0.25 : queueLength > 10 ? 0.5 : 1;

    await sleep(duration * speed);

    await _executeQueue();
  }

  return { enqueue };
}
