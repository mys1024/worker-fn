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
   * A boolean value indicating whether to transfer the arguments, or a function that returns transferable objects should be transferred.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   * @returns Transferable objects.
   */
  transfer?: boolean | ((ctx: { args: Parameters<FN> }) => Transferable[]);
}
