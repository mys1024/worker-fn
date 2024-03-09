import type { MsgPort } from "./rpc/types.ts";

export type AnyFn = (...args: any[]) => any;

export interface DefineWorkerFnOpts {
  /**
   * Whether to transfer the return value of worker function if it is of type `Transferable`.
   *
   * @default true
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   */
  transfer?: boolean;

  port?: MsgPort;
}

export interface UseWorkerFnOpts<FN extends AnyFn> {
  /**
   * A function that determines objects to be transferred when posting messages to the worker thread.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   * @param ctx The context of proxy function invocation.
   * @returns Transferable objects.
   */
  transfer?: (ctx: { args: Parameters<FN> }) => Transferable[];
}

export type InternalFns = {
  names: () => string[];
};
