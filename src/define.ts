import { MRpc, type WorkerGlobalScope } from "@mys-x/m-rpc";
import type { AnyFn, DefineOptions } from "./types.ts";

/* -------------------------------------------------- defineWorkerFn() -------------------------------------------------- */

/**
 * Define a worker function.
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
 * Define worker functions.
 *
 * @param fns - An object containing worker functions. Keys will be used as the names of the worker functions.
 * @param options - An object containing options.
 */
export function defineWorkerFns<FNS extends Record<string, AnyFn>>(
  fns: FNS,
  options: {
    [NAME in keyof FNS]?: DefineOptions<FNS[NAME]>;
  } = {},
): void {
  for (const [name, fn] of Object.entries(fns)) {
    defineWorkerFn(name, fn, options[name]);
  }
}
