import type { MsgPort } from "./rpc/types.ts";

/* -------------------------------------------------- general -------------------------------------------------- */

export type AnyFn = (...args: any[]) => any;

export type AwaitedRet<FN extends AnyFn> = Awaited<ReturnType<FN>>;

export type ProxyFn<FN extends AnyFn> = (
  ...args: Parameters<FN>
) => Promise<AwaitedRet<FN>>;

export type ProxyFns<FNS extends Record<string, AnyFn>> = {
  [P in keyof FNS]: ProxyFn<FNS[P]>;
};

/* -------------------------------------------------- internal functions -------------------------------------------------- */

export type InternalFns = {
  names: () => string[];
};

/* -------------------------------------------------- options -------------------------------------------------- */

export interface DefineWorkerFnOpts<FN extends AnyFn> {
  /**
   * A boolean value indicating whether to transfer the transferable objects exist in the return value of the worker function,
   * or a function that returns transferable objects should be transferred.
   *
   * @default true
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   */
  transfer?: boolean | ((ctx: { ret: ReturnType<FN> }) => Transferable[]);

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
   * A boolean value indicating whether to transfer the transferable objects exist in the arguments,
   * or a function that returns transferable objects should be transferred.
   *
   * @default true
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   */
  transfer?: boolean | ((ctx: { args: Parameters<FN> }) => Transferable[]);
}
