import type { AnyFn, DefineWorkerFnOpts, InternalFns } from "./types.ts";
import type { MsgPort, MsgPortNormalized } from "./rpc/types.ts";
import { getGlobal } from "./rpc/utils.ts";
import { RpcAgent } from "./rpc/rpc.ts";

/* -------------------------------------------------- common -------------------------------------------------- */

const _global = getGlobal() as MsgPortNormalized;

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
 * @param functions - An object containing worker functions. Keys will be used as the name of the worker functions.
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

const INTERNAL_FNS_DEFINED_SYM = Symbol("INTERNAL_FNS_DEFINED_SYM");

function ensureInternalFns(port: MsgPort) {
  // prevent double usage
  if ((port as any)[INTERNAL_FNS_DEFINED_SYM]) {
    return;
  }
  (port as any)[INTERNAL_FNS_DEFINED_SYM] = true;
  // get RpcAgent instance
  const rpcAgent = RpcAgent.getRpcAgent(port);
  // internal functions
  const internalFns: InternalFns = {
    /**
     * @returns Names of defined worker functions
     */
    names: () => rpcAgent.getLocalFnNames("fn"),
  };
  // define internal functions
  for (const [name, fn] of Object.entries(internalFns)) {
    rpcAgent.defineLocalFn(name, fn, { namespace: "fn-internal" });
  }
}
