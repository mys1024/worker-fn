import type { AnyFn, UseWorkerFnOpts } from "./types.ts";
import type { InternalFns } from "./define.ts";
import { getRpcAgent } from "./rpc/rpc.ts";

/* -------------------------------------------------- common -------------------------------------------------- */

type AwaitedRet<FN extends AnyFn> = Awaited<ReturnType<FN>>;

type ProxyFn<FN extends AnyFn> = (
  ...args: Parameters<FN>
) => Promise<AwaitedRet<FN>>;

type ProxyFns<FNS extends Record<string, AnyFn>> = {
  [P in keyof FNS]: ProxyFn<FNS[P]>;
};

/* -------------------------------------------------- useWorkerFn(s) -------------------------------------------------- */

/**
 * Invoke this function in the main thread to create a proxy function that calls the corresponding worker function.
 *
 * @param name - The name that identifies the worker function.
 * @param worker - Either a Worker instance or an object containing options for creating a lazy Worker instance.
 * @param options - An object containing options.
 * @returns The proxy function.
 */
export function useWorkerFn<FN extends AnyFn>(
  name: string,
  worker: Worker,
  options: UseWorkerFnOpts<FN> = {},
): ProxyFn<FN> {
  const { transfer } = options;
  const rpcAgent = getRpcAgent(worker);

  function fn(...args: Parameters<FN>) {
    return rpcAgent.callRemoteFn(name, {
      args,
      namespace: "fn",
      transfer: transfer ? () => transfer({ args }) : undefined,
    });
  }

  return fn;
}

/**
 * Invoke this function in the main thread to create proxy functions of all worker functions.
 *
 * @param worker - Either a Worker instance or an object containing options for creating a lazy Worker instance.
 * @returns Proxy functions.
 */
export function useWorkerFns<FNS extends Record<string, AnyFn>>(
  worker: Worker,
): ProxyFns<FNS> {
  const fns = new Proxy({}, {
    get(_target, name) {
      if (typeof name !== "string") {
        throw new Error("The name must be a string.", { cause: name });
      }
      const fn = useWorkerFn(name, worker);
      return fn;
    },
  });

  return fns as ProxyFns<FNS>;
}

/* -------------------------------------------------- inspectWorker -------------------------------------------------- */

/**
 * Inspect a worker.
 *
 * @param worker The worker.
 * @returns Information about the worker.
 */
export async function inspectWorker(worker: Worker): Promise<{
  names: string[];
}> {
  const rpcAgent = getRpcAgent(worker);
  const names = await rpcAgent.callRemoteFn<InternalFns["names"]>("names", {
    namespace: "fn-internal",
  });
  return { names };
}
