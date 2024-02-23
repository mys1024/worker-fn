// deno-lint-ignore-file no-explicit-any

/* -------------------------------------------------- types -------------------------------------------------- */

// prevents TS errors
declare const self:
  & Worker
  & Record<string, any>;

type AnyFn = (...args: any[]) => any;

interface MainThreadMessage<FN extends AnyFn = AnyFn> {
  key: number;
  name: string;
  args: Parameters<FN>;
}

/* -------------------------------------------------- transferable -------------------------------------------------- */

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

/* -------------------------------------------------- names -------------------------------------------------- */

// Defined names
const names = new Set<string>();

// Check undefined names
self.addEventListener("message", (event) => {
  const { name, key } = event.data as MainThreadMessage;
  if (names.has(name)) {
    return;
  }
  self.postMessage({
    ok: false,
    key,
    name,
    ret: undefined,
    err: new Error(`The name "${name}" is not defined.`),
  });
});

/* -------------------------------------------------- defineWorkerFn -------------------------------------------------- */

/**
 * Invoke this function in worker threads to define a worker function.
 *
 * @param name - A name that identifies the worker function.
 * @param fn - The worker function.
 * @param options - An object containing options.
 */
export function defineWorkerFn<FN extends AnyFn>(
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

  // Define the name
  if (names.has(name)) {
    throw new Error(`The name "${name}" has already been defined.`);
  } else {
    names.add(name);
  }

  // Listen for messages from the main thread
  self.addEventListener("message", async (event) => {
    // Destructure the message from main thread
    const { key, name: receivedName, args } = event.data as MainThreadMessage<
      FN
    >;

    // Check if the received message is intended for this worker function
    if (receivedName !== name) {
      return;
    }

    try {
      // Invoke the worker function with the provided arguments
      const ret = await fn(...args);
      // Post the return value back to the main thread
      self.postMessage({
        ok: true,
        key,
        name,
        ret,
        err: undefined,
      }, {
        transfer: transfer && isTransferable(ret) ? [ret] : undefined,
      });
    } catch (err) {
      // Post the return value back to the main thread
      self.postMessage({
        ok: false,
        key,
        name,
        ret: undefined,
        err,
      });
    }
  });
}