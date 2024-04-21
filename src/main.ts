/**
 * worker-fn hides the complexity of communication between the JavaScript main thread and Worker threads,
 * making it easy to call the functions defined in workers.
 */

import {
  MRpc,
  type NodeWorkerOrNodeMessagePort,
  type WorkerGlobalScope,
} from "@mys-x/m-rpc";
import type {
  AnyFn,
  CallOptions,
  DefineOptions,
  ProxyFn,
  ProxyFns,
} from "./types.ts";

/**
 * Define a worker function.
 *
 * @param name - A name that identifies the worker function.
 * @param fn - The worker function.
 * @param options - An object containing options.
 */
function defineWorkerFn<FN extends AnyFn>(
  name: string,
  fn: FN,
  options: DefineOptions<FN> = {},
): void {
  const {
    port = globalThis as unknown as WorkerGlobalScope,
    ...restOptions
  } = options;
  const rpc = MRpc.ensureMRpc(port);
  rpc.defineLocalFn(name, fn, restOptions);
}

/**
 * Define worker functions.
 *
 * @param fns - An object containing worker functions. Keys will be used as the names of the worker functions.
 * @param options - An object containing options.
 */
function defineWorkerFns<FNS extends Record<string, AnyFn>>(
  fns: FNS,
  options: {
    [NAME in keyof FNS]?: DefineOptions<FNS[NAME]>;
  } = {},
): void {
  for (const [name, fn] of Object.entries(fns)) {
    defineWorkerFn(name, fn, options[name]);
  }
}

/**
 * Create a proxy function that calls the corresponding worker function.
 *
 * @param name - The name that identifies the worker function.
 * @param worker - A worker instance.
 * @param options - An object containing options.
 * @returns The proxy function.
 */
function useWorkerFn<FN extends AnyFn>(
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

/**
 * Create the proxy functions of all worker functions.
 *
 * @param worker - A worker instance.
 * @param options - An object containing options.
 * @returns The proxy functions.
 */
function useWorkerFns<FNS extends Record<string, AnyFn>>(
  worker: Worker | NodeWorkerOrNodeMessagePort,
  options?: {
    [NAME in keyof FNS]?: CallOptions<FNS[NAME]>;
  },
): ProxyFns<FNS> {
  const rpc = MRpc.ensureMRpc(worker);
  return rpc.useRemoteFns(options);
}

/**
 * Inspect a worker.
 *
 * @param worker A worker instance.
 * @returns Information about the worker.
 */
async function inspectWorker(
  worker: Worker | NodeWorkerOrNodeMessagePort,
): Promise<{
  names: string[] | undefined;
}> {
  const rpc = MRpc.ensureMRpc(worker);
  return {
    names: await rpc.getRemoteFnNames(),
  };
}

export {
  defineWorkerFn,
  defineWorkerFns,
  inspectWorker,
  useWorkerFn,
  useWorkerFns,
};

export type { CallOptions, DefineOptions } from "./types.ts";
