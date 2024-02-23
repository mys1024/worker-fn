// deno-lint-ignore-file no-explicit-any

// prevents TS errors
declare const self: Worker & Record<string, any>;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects#supported_objects
 */
const transferableClasses = [
  self.ArrayBuffer,
  self.MessagePort,
  self.ReadableStream,
  self.WritableStream,
  self.TransformStream,
  self.WebTransportReceiveStream,
  self.WebTransportSendStream,
  self.AudioData,
  self.ImageBitmap,
  self.VideoFrame,
  self.OffscreenCanvas,
  self.RTCDataChannel,
].filter((c) => !!c);

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
 */
function isTransferable(val: any): val is Transferable {
  return transferableClasses.some((c) => val instanceof c);
}

/**
 * Invoke this function in worker threads to define a worker function.
 *
 * @param name - A name that identifies the worker function.
 * @param fn - The worker function.
 * @param options - An object containing options.
 */
export function defineWorkerFn<FN extends (...args: any[]) => any>(
  name: string,
  fn: FN,
  options: {
    /**
     * Whether to transfer the return value of worker function if it is of type `Transferable`.
     *
     * @default true
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
     */
    transfer?: boolean;
  } = {},
): void {
  // Options
  const { transfer = true } = options;

  // Listen for incoming messages from the main thread
  self.addEventListener("message", async (event) => {
    const { key, name: receivedName, args } = (event as MessageEvent<{
      key: number;
      name: string;
      args: Parameters<FN>;
    }>).data;

    // Check if the received message is intended for this worker function
    if (receivedName !== name) {
      return;
    }

    // Invoke the worker function with the provided arguments
    const ret = await fn(...args);

    // Post the return value back to the main thread
    self.postMessage({
      key,
      name,
      ret,
    }, {
      transfer: transfer && isTransferable(ret) ? [ret] : undefined,
    });
  });
}
