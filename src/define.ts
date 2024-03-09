import type { AnyFn, DefineWorkerFnOpts, InternalFns } from "./types.ts";
import type { MsgPort, MsgPortNormalized } from "./rpc/types.ts";
import { RpcAgent } from "./rpc/rpc.ts";

/* -------------------------------------------------- common -------------------------------------------------- */

const _global = Function("return this")() as MsgPortNormalized;

/* -------------------------------------------------- defineWorkerFn() -------------------------------------------------- */

/**
 * Invoke this function in worker threads to define a worker function.
 *
 * @param name - A name that identifies the worker function.
 * @param fn - The worker function.
 * @param options - An object containing options.
 */
export function defineWorkerFn(
  name: string,
  fn: AnyFn,
  options: DefineWorkerFnOpts = {},
): void {
  const { transfer, port = _global } = options;
  const rpcAgent = RpcAgent.getRpcAgent(port);
  ensureInternalFns(port);
  rpcAgent.defineLocalFn(name, fn, {
    namespace: "fn",
    transfer,
  });
}

/* -------------------------------------------------- defineWorkerFns() -------------------------------------------------- */

/**
 * Invoke this function in worker threads to define worker functions.
 *
 * @param functions - An object containing worker functions. Keys will be used as the names of the worker functions.
 * @param options - An object containing options.
 */
export function defineWorkerFns(
  functions: Record<string, AnyFn>,
  options: DefineWorkerFnOpts = {},
): void {
  for (const [name, fn] of Object.entries(functions)) {
    defineWorkerFn(name, fn, options);
  }
}

/* -------------------------------------------------- internal functions -------------------------------------------------- */

const INTERNAL_FNS_DEFINED = Symbol("internalFnsDefined");

/**
 * Ensure that internal functions are defined.
 */
function ensureInternalFns(port: MsgPort) {
  // prevent double usage
  if ((port as any)[INTERNAL_FNS_DEFINED]) {
    return;
  }
  (port as any)[INTERNAL_FNS_DEFINED] = true;
  // get RpcAgent instance
  const rpcAgent = RpcAgent.getRpcAgent(port);
  // define internal functions
  const internalFns: InternalFns = {
    /**
     * @returns Names of defined worker functions
     */
    names: () => rpcAgent.getLocalFnNames("fn"),
  };
  for (const [name, fn] of Object.entries(internalFns)) {
    rpcAgent.defineLocalFn(name, fn, { namespace: "fn-internal" });
  }
}
