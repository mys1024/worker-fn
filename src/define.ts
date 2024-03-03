import type { AnyFn, DefineWorkerFnOpts } from "./types.ts";
import { getGlobal } from "./rpc/utils.ts";
import { getRpcAgent } from "./rpc/rpc.ts";

/* -------------------------------------------------- common -------------------------------------------------- */

const rpcAgent = getRpcAgent(getGlobal());

/* -------------------------------------------------- defineWorkerFn(s) -------------------------------------------------- */

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
  const { transfer } = options;
  rpcAgent.defineLocalFn(name, fn, {
    namespace: "fn",
    transfer,
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
  const { transfer } = options;
  for (const [name, fn] of Object.entries(functions)) {
    rpcAgent.defineLocalFn(name, fn, {
      namespace: "fn",
      transfer,
    });
  }
}

/* -------------------------------------------------- internal functions -------------------------------------------------- */

/**
 * @returns Names of defined worker function
 */
function names() {
  return rpcAgent.getLocalFnNames("fn");
}

rpcAgent.defineLocalFn("names", names, { namespace: "fn-internal" });

export type InternalFns = {
  names: typeof names;
};
