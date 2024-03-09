import type { AnyFn, InternalFns, UseWorkerFnOpts } from "./types.ts";
import type { MsgPort } from "./rpc/types.ts";
import { RpcAgent } from "./rpc/rpc.ts";

/* -------------------------------------------------- common -------------------------------------------------- */

type AwaitedRet<FN extends AnyFn> = Awaited<ReturnType<FN>>;

type ProxyFn<FN extends AnyFn> = (
  ...args: Parameters<FN>
) => Promise<AwaitedRet<FN>>;

type ProxyFns<FNS extends Record<string, AnyFn>> = {
  [P in keyof FNS]: ProxyFn<FNS[P]>;
};

/* -------------------------------------------------- useWorkerFn() -------------------------------------------------- */

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
  worker: MsgPort,
  options: UseWorkerFnOpts<FN> = {},
): ProxyFn<FN> {
  const { transfer } = options;
  const rpcAgent = RpcAgent.getRpcAgent(worker);
  // the proxy function
  function fn(...args: Parameters<FN>) {
    return rpcAgent.callRemoteFn(name, {
      args,
      namespace: "fn",
      transfer: transfer ? () => transfer({ args }) : undefined,
    });
  }
  return fn;
}

/* -------------------------------------------------- useWorkerFns() -------------------------------------------------- */

/**
 * Invoke this function in the main thread to create proxy functions of all worker functions.
 *
 * @param worker - A Worker instance.
 * @returns Proxy functions.
 */
export function useWorkerFns<FNS extends Record<string, AnyFn>>(
  worker: MsgPort,
): ProxyFns<FNS> {
  const memo = new Map<string, ProxyFn<AnyFn>>();
  const fns = new Proxy({}, {
    get(_target, name) {
      if (typeof name !== "string") {
        throw new Error("The name must be a string.", { cause: name });
      }
      if (memo.has(name)) {
        return memo.get(name);
      }
      const fn = useWorkerFn(name, worker);
      memo.set(name, fn);
      return fn;
    },
  });
  return fns as ProxyFns<FNS>;
}

/* -------------------------------------------------- inspectWorker() -------------------------------------------------- */

/**
 * Inspect a worker.
 *
 * @param worker The worker.
 * @returns Information about the worker.
 */
export async function inspectWorker(worker: Worker): Promise<{
  names: string[];
}> {
  const rpcAgent = RpcAgent.getRpcAgent(worker);
  const names = await rpcAgent.callRemoteFn<InternalFns["names"]>("names", {
    namespace: "fn-internal",
  });
  return { names };
}
