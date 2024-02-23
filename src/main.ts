// deno-lint-ignore-file no-explicit-any

/* -------------------------------------------------- types -------------------------------------------------- */

/**
 * This is a global function in worker threads. It sends a message to the main thread.
 */
declare function postMessage(data: any, transfer?: Transferable[]): void;

/* -------------------------------------------------- exports -------------------------------------------------- */

/**
 * Call this function within the main thread to obtain a proxy function that executes the corresponding worker function defined within the worker thread.
 *
 * @param options - An object containing options for configuring the proxy function.
 * @param options.name - The name of the worker function.
 * @param options.worker - Either a Worker instance or an object with a factory method to create a Worker instance.
 * @param options.worker.factory - A function that returns a Worker instance.
 * @param options.worker.eager - Whether to eagerly load the worker or not. Default is false.
 * @returns An object containing the proxy function `fn`.
 */
export function useWorkerFn<FN extends (...args: any[]) => any>(options: {
  /**
   * The name of the worker function.
   */
  name: string;
  /**
   * Either a Worker instance or an object with a factory method to create a Worker instance.
   */
  worker: Worker | {
    /**
     * A function that returns a Worker instance.
     */
    factory: () => Worker;
    /**
     * Whether to eagerly load the worker or not. Default is false.
     */
    eager?: boolean;
  };
}): {
  /**
   * The proxy function.
   */
  fn: (...args: Parameters<FN>) => Promise<Awaited<ReturnType<FN>>>;
} {
  const { name, worker: _worker } = options;

  // Check if a Worker instance is provided or if eager loading is requested
  const eagerWorker = _worker instanceof Worker
    ? _worker
    : _worker.eager
    ? _worker.factory()
    : undefined;

  // Proxy function
  function fn(...args: Parameters<FN>) {
    return new Promise<Awaited<ReturnType<FN>>>((resolve) => {
      // Generate a random key to identify the specific call
      const key = Math.random();

      // Determine if the worker should be terminated after execution
      const isLazy = !eagerWorker;

      // Get the worker instance
      const worker = eagerWorker || (_worker as {
        factory: () => Worker;
      }).factory();

      // Event handler for messages from the worker thread
      const handler = (
        event: MessageEvent<
          { key: number; name: string; ret: Awaited<ReturnType<FN>> }
        >,
      ) => {
        const { key: receivedKey, ret } = event.data;

        // Check if the message corresponds to the current call
        if (receivedKey !== key) {
          return;
        }

        // Remove the event listener and resolve the promise with the return value
        worker.removeEventListener("message", handler);
        resolve(ret);

        // Terminate the worker if it's a lazy instance (eager loading not requested)
        if (isLazy) {
          worker.terminate();
        }
      };

      // Add the event listener for messages from the worker thread
      worker.addEventListener("message", handler);

      // Send a message to the worker with function name and arguments
      worker.postMessage({
        key,
        name,
        args,
      });
    });
  }

  return {
    fn,
  };
}

/**
 * Call this function within a worker thread to define a worker function.
 *
 * @param options - An object containing options for defining the worker function.
 * @param options.name - The name of the worker function.
 * @param options.fn - The function to be executed within the worker thread.
 * @param options.transfer - Whether to transfer the return value or not. When the return value is of Transferable type, it will be transferred by default. See: https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
 */
export function defineWorkerFn<FN extends (...args: any[]) => any>(options: {
  /**
   * The name of the worker function.
   */
  name: string;
  /**
   * The function to be executed within the worker thread.
   */
  fn: FN;
  /**
   * Whether to transfer the return value or not. When the return value is of Transferable type, it will be transferred by default.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   */
  transfer?: boolean;
}): void {
  const { name, fn, transfer: _transfer } = options;

  // Listen for incoming messages from the main thread
  addEventListener("message", async (event) => {
    const { key, name: receivedName, args } = (event as MessageEvent<{
      key: number;
      name: string;
      args: Parameters<FN>;
    }>).data;

    // Check if the received message is intended for this worker function
    if (receivedName !== name) {
      return;
    }

    // Call the worker function with the provided arguments
    const ret = await fn(...args);

    // Determine whether to transfer the return value
    const transfer = typeof _transfer === "boolean"
      ? _transfer ? [ret] as Transferable[] : undefined
      : isTransferable(ret)
      ? [ret]
      : undefined;

    // Send the result back to the main thread
    postMessage({
      key,
      name,
      ret,
    }, transfer);
  });
}

/* -------------------------------------------------- utils -------------------------------------------------- */

const _self = self as any;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects#supported_objects
 */
const transferableClasses = [
  _self.ArrayBuffer,
  _self.MessagePort,
  _self.ReadableStream,
  _self.WritableStream,
  _self.TransformStream,
  _self.WebTransportReceiveStream,
  _self.WebTransportSendStream,
  _self.AudioData,
  _self.ImageBitmap,
  _self.VideoFrame,
  _self.OffscreenCanvas,
  _self.RTCDataChannel,
].filter((c) => !!c);

function isTransferable(val: any): val is Transferable {
  return transferableClasses.some((c) => val instanceof c);
}
