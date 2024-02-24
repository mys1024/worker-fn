import type { AnyFn, MainThreadMessage, WorkerThreadMessage } from "./types.ts";

/* -------------------------------------------------- types -------------------------------------------------- */

interface LazyWorker {
  /**
   * A function that returns a new Worker instance.
   */
  factory: () => Worker;
  /**
   * Time to live (in millisecond). Passing in `-1` will keep it alive forever.
   *
   * @default 0
   */
  ttl?: number;
}

/* -------------------------------------------------- useWorkerFn -------------------------------------------------- */

/**
 * Invoke this function in the main thread to create a proxy function that calls the corresponding worker function.
 *
 * @param name - The name that identifies the worker function.
 * @param worker - Either a Worker instance or an object containing options for creating a lazy Worker instance.
 * @param options - An object containing options.
 * @returns The proxy function.
 */
export function useWorkerFn<FN extends AnyFn>(
  name: string,
  worker: Worker | LazyWorker,
  options: {
    /**
     * A function that determines objects to be transferred when posting messages to the worker thread.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
     * @param ctx The context of proxy function invocation.
     * @returns Transferable objects.
     */
    transfer?: (ctx: { args: Parameters<FN> }) => Transferable[];
  } = {},
): (...args: Parameters<FN>) => Promise<Awaited<ReturnType<FN>>> {
  // Options
  const { transfer } = options;

  // States
  let callCount = 0;
  let callingCount = 0;

  // Worker instance and its TTL
  let workerInst: Worker | undefined;
  let workerTtlTimeoutId: number | undefined;
  const ttl = worker instanceof Worker
    ? -1
    : worker.ttl === undefined
    ? 0
    : worker.ttl;

  // Proxy function
  function fn(...args: Parameters<FN>) {
    return new Promise<Awaited<ReturnType<FN>>>((resolve, reject) => {
      // Update states
      callCount++;
      callingCount++;

      // Identify the current call
      const key = callCount;

      // Get the worker instance
      const workerInstCurr = workerInst = workerInst
        ? workerInst
        : worker instanceof Worker
        ? worker
        : worker.factory();

      // Stop the TTL timeout of the worker instance
      clearTimeout(workerTtlTimeoutId);

      // Event handler for messages from the worker thread
      const handler = (event: MessageEvent) => {
        // Destructure the message from worker thread
        const { ok, key: receivedKey, ret, err } = event
          .data as WorkerThreadMessage<FN>;
        // Check if the message corresponds to the current call
        if (receivedKey !== key) {
          return;
        }
        // Remove the message event listener
        workerInstCurr.removeEventListener("message", handler);
        // Update states
        callingCount--;
        // Set a TTL timeout for the worker instance
        if (callingCount === 0 && ttl >= 0 && ttl !== Infinity) {
          const terminate = () => {
            workerInst?.terminate();
            workerInst = undefined;
          };
          clearTimeout(workerTtlTimeoutId);
          workerTtlTimeoutId = ttl === 0
            ? (terminate(), undefined)
            : setTimeout(terminate, ttl);
        }
        // resolve the promise with the return value, or reject the promise with the err
        if (ok) {
          resolve(ret);
        } else {
          reject(
            new Error(`The worker function "${name}" throws an exception.`, {
              cause: err,
            }),
          );
        }
      };

      // Listen for messages from the worker thread
      workerInstCurr.addEventListener("message", handler);

      // Post a message to the worker
      const message: MainThreadMessage<FN> = {
        key,
        name,
        args,
      };
      workerInstCurr.postMessage(message, {
        transfer: transfer?.({ args }),
      });
    });
  }

  // Return the proxy function
  return fn;
}
