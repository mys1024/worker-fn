import { MRpc, type NodeWorkerOrNodeMessagePort } from "@mys/m-rpc";
import type { AnyFn, CallOptions, ProxyFn, ProxyFns } from "./types.ts";

/* -------------------------------------------------- useWorkerFn() -------------------------------------------------- */

/**
 * Invoke this function in the main thread to create a proxy function that calls the corresponding worker function.
 *
 * @param name - The name that identifies the worker function.
 * @param worker - A Worker instance.
 * @param options - An object containing options.
 * @returns The proxy function.
 */
export function useWorkerFn<FN extends AnyFn>(
  name: string,
  worker: Worker | NodeWorkerOrNodeMessagePort,
  options?: CallOptions<FN>,
): ProxyFn<FN> {
  const rpc = MRpc.ensureMRpc(worker);
  const _fn = rpc.useRemoteFn(name, options);
  const fn = (async (...args) => {
    try {
      return await _fn(...args);
    } catch (err) {
      // overwrite the error message
      if (
        err instanceof Error &&
        err.message ===
          `The remote threw an error when calling the function "${name}".`
      ) {
        err.message = `The worker function "${name}" throws an error.`;
      }
      throw err;
    }
  }) as ProxyFn<FN>;
  return fn;
}

/* -------------------------------------------------- useWorkerFns() -------------------------------------------------- */

/**
 * Invoke this function in the main thread to create proxy functions of all worker functions.
 *
 * @param worker - A Worker instance.
 * @param options - An object containing options.
 * @returns Proxy functions.
 */
export function useWorkerFns<FNS extends Record<string, AnyFn>>(
  worker: Worker | NodeWorkerOrNodeMessagePort,
  options?: {
    [NAME in keyof FNS]?: CallOptions<FNS[NAME]>;
  },
): ProxyFns<FNS> {
  const rpc = MRpc.ensureMRpc(worker);
  return rpc.useRemoteFns(options);
}

/* -------------------------------------------------- inspectWorker() -------------------------------------------------- */

/**
 * Inspect a worker.
 *
 * @param worker A worker instance.
 * @returns Information about the worker.
 */
export async function inspectWorker(
  worker: Worker | NodeWorkerOrNodeMessagePort,
): Promise<{
  names: string[] | undefined;
}> {
  const rpc = MRpc.ensureMRpc(worker);
  return {
    names: await rpc.getRemoteFnNames(),
  };
}
