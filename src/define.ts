import type { AnyFn, MainThreadMessage, WorkerThreadMessage } from "./types.ts";

/* -------------------------------------------------- types -------------------------------------------------- */

// prevents TS errors
declare const self:
  & {
    addEventListener: Worker["addEventListener"];
    postMessage: (
      message: WorkerThreadMessage,
      options?: StructuredSerializeOptions | undefined,
    ) => void;
  }
  & Record<string, any>;

interface WorkerFnConfig {
  fn: AnyFn;
  transfer: boolean;
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

/* -------------------------------------------------- defined functions -------------------------------------------------- */

const fns = new Map<string, WorkerFnConfig>();

/* -------------------------------------------------- listen calls from main thread -------------------------------------------------- */

self.addEventListener("message", async (event) => {
  const { key, name, args } = event.data as MainThreadMessage;

  // get the corresponding worker function
  const { fn, transfer } = fns.get(name) || {};
  if (!fn) {
    self.postMessage({
      ok: false,
      key,
      name,
      err: new Error(`The name "${name}" is not defined.`),
    });
    return;
  }

  // invoke the worker function
  try {
    const ret = await fn(...args);
    self.postMessage({
      ok: true,
      key,
      name,
      ret,
    }, {
      transfer: transfer && isTransferable(ret) ? [ret] : undefined,
    });
  } catch (err) {
    self.postMessage({
      ok: false,
      key,
      name,
      err,
    });
  }
});

/* -------------------------------------------------- defineWorkerFn() -------------------------------------------------- */

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
  const { transfer = true } = options;

  if (fns.has(name)) {
    throw new Error(`The name "${name}" has already been defined.`);
  } else {
    fns.set(name, { fn, transfer });
  }
}

/* -------------------------------------------------- defineWorkerFns() -------------------------------------------------- */

/**
 * Invoke this function in worker threads to define worker functions.
 *
 * @param functions - An object containing worker functions. Keys will be used as the name of the worker functions.
 * @param options - An object containing options.
 */
export function defineWorkerFns(
  functions: Record<string, AnyFn>,
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
  for (const [name, fn] of Object.entries(functions)) {
    defineWorkerFn(name, fn, options);
  }
}
