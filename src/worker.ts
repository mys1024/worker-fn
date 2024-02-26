import type { AnyFn, WorkerThreadMessage } from "./types.ts";
import { isMainThreadMessage } from "./utils.ts";

/* -------------------------------------------------- common -------------------------------------------------- */

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

interface WorkerFnConfig {
  fn: AnyFn;
  transfer: boolean;
}

const fns = new Map<string, WorkerFnConfig>();
const internalFns = new Map<string, WorkerFnConfig>();

/* -------------------------------------------------- defineWorkerFn(s) -------------------------------------------------- */

interface DefineWorkerFnOpts {
  /**
   * Whether to transfer the return value of worker function if it is of type `Transferable`.
   *
   * @default true
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   */
  transfer?: boolean;
}

/**
 * The normalized function to define a worker function.
 */
export function define<FN extends AnyFn>(
  name: string,
  fn: FN,
  options: DefineWorkerFnOpts & {
    internal?: boolean;
  } = {},
): void {
  const { transfer = true, internal = false } = options;

  const _fns = internal ? internalFns : fns;

  if (_fns.has(name)) {
    throw new Error(`The name "${name}" has already been defined.`);
  } else {
    _fns.set(name, { fn, transfer });
  }
}

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
  options: DefineWorkerFnOpts = {},
): void {
  define(name, fn, {
    ...options,
    internal: false, // ensure not internal
  });
}

/**
 * Invoke this function in worker threads to define worker functions.
 *
 * @param functions - An object containing worker functions. Keys will be used as the name of the worker functions.
 * @param options - An object containing options.
 */
export function defineWorkerFns(
  functions: Record<string, AnyFn>,
  options: DefineWorkerFnOpts = {},
): void {
  for (const [name, fn] of Object.entries(functions)) {
    define(name, fn, {
      ...options,
      internal: false, // ensure not internal
    });
  }
}

/* -------------------------------------------------- internal functions -------------------------------------------------- */

/**
 * @returns Names of defined worker function
 */
function $names() {
  return Array.from(fns.keys());
}

define("$names", $names, { internal: true });

export type InternalFns = {
  $names: typeof $names;
};

/* -------------------------------------------------- listen calls from main thread -------------------------------------------------- */

self.addEventListener("message", async (event) => {
  if (!isMainThreadMessage(event.data)) {
    return;
  }
  const { meta, args } = event.data;
  const { internal, name } = meta;

  // get the corresponding worker function
  const _fns = internal ? internalFns : fns;
  const { fn, transfer } = _fns.get(name) || {};
  if (!fn) {
    self.postMessage({
      meta,
      ok: false,
      err: new Error(`The name "${name}" is not defined.`),
    });
    return;
  }

  // invoke the worker function
  try {
    const ret = await fn(...args);
    self.postMessage({
      meta,
      ok: true,
      ret,
    }, {
      transfer: transfer && isTransferable(ret) ? [ret] : undefined,
    });
  } catch (err) {
    self.postMessage({
      meta,
      ok: false,
      err,
    });
  }
});
