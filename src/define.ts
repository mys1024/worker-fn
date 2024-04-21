import { MRpc } from "@mys/m-rpc";
import type { AnyFn, DefineOptions, WorkerGlobalScope } from "./types.ts";

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
  options: DefineOptions<FN> = {},
): void {
  const {
    port = globalThis as unknown as WorkerGlobalScope,
    ...restOptions
  } = options;
  const rpc = MRpc.ensureMRpc(port);
  rpc.defineLocalFn(name, fn, restOptions);
}

/* -------------------------------------------------- defineWorkerFns() -------------------------------------------------- */

/**
 * Invoke this function in worker threads to define worker functions.
 *
 * @param functions - An object containing worker functions. Keys will be used as the names of the worker functions.
 * @param options - An object containing options.
 */
export function defineWorkerFns<FNS extends Record<string, AnyFn>>(
  functions: FNS,
  options: {
    [NAME in keyof FNS]?: DefineOptions<FNS[NAME]>;
  } = {},
): void {
  for (const [name, fn] of Object.entries(functions)) {
    defineWorkerFn(name, fn, options[name]);
  }
}
