import type { MsgPort } from "./rpc/types.ts";

export type AnyFn = (...args: any[]) => any;

export type AwaitedRet<FN extends AnyFn> = Awaited<ReturnType<FN>>;

export type ProxyFn<FN extends AnyFn> = (
  ...args: Parameters<FN>
) => Promise<AwaitedRet<FN>>;

export type ProxyFns<FNS extends Record<string, AnyFn>> = {
  [P in keyof FNS]: ProxyFn<FNS[P]>;
};

export type InternalFns = {
  names: () => string[];
};

export interface DefineWorkerFnOpts {
  /**
   * Whether to transfer the return value of worker function if it is of type `Transferable`.
   *
   * @default true
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   */
  transfer?: boolean;

  /**
   * The message port to communicate with the main thread.
   *
   * @default self
   * @example
   * // In Node.js
   * import { parentPort } from "node:worker_threads";
   * defineWorkerFn("add", add, { port: parentPort! });
   */
  port?: MsgPort;
}

export interface UseWorkerFnOpts<FN extends AnyFn> {
  /**
   * A function that determines objects to be transferred when posting messages to the worker thread.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   * @param ctx The context of the function call.
   * @returns Transferable objects.
   */
  transfer?: (ctx: { args: Parameters<FN> }) => Transferable[];
}
