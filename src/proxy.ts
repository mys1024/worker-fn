import type { AnyFn, MainThreadMessage, WorkerThreadMessage } from "./types.ts";
import type { InternalFns } from "./worker.ts";
import { isWorkerThreadMessage } from "./utils.ts";

/* -------------------------------------------------- common -------------------------------------------------- */

// prevents tsup errors
declare function setTimeout(
  cb: (...args: any[]) => void,
  delay?: number | undefined,
  ...args: any[]
): number;

interface LazyWorker {
  /**
   * A function that returns a new Worker instance.
   */
  factory: () => Worker;
  /**
   * Time to live (in millisecond). Passing in `-1` will keep it alive forever.
   *
   * @default 0
   */
  ttl?: number;
}

interface UseWorkerFnOpts<FN extends AnyFn> {
  /**
   * A function that determines objects to be transferred when posting messages to the worker thread.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   * @param ctx The context of proxy function invocation.
   * @returns Transferable objects.
   */
  transfer?: (ctx: { args: Parameters<FN> }) => Transferable[];
}

type AwaitedRet<FN extends AnyFn> = Awaited<ReturnType<FN>>;

type ProxyFn<FN extends AnyFn> = (
  ...args: Parameters<FN>
) => Promise<AwaitedRet<FN>>;

type ProxyFns<FNS extends Record<string, AnyFn>> = {
  [P in keyof FNS]: ProxyFn<FNS[P]>;
};

/* -------------------------------------------------- use -------------------------------------------------- */

interface WorkerExtended<FN extends AnyFn> extends Worker {
  [InitSymbol]: boolean;
  [FnsSymbol]: {
    internal: Map<
      string,
      Map<
        number,
        [(ret: Awaited<ReturnType<FN>>) => void, (err: any) => void]
      >
    >; // name -> key -> [resolve, reject]
    external: Map<
      string,
      Map<
        number,
        [(ret: Awaited<ReturnType<FN>>) => void, (err: any) => void]
      >
    >; // name -> key -> [resolve, reject]
  };
}

const InitSymbol = Symbol("InitSymbol");
const FnsSymbol = Symbol("FnsSymbol");

/**
 * The normalized function to define a proxy function.
 */
export function use<FN extends AnyFn>(
  name: string,
  worker: Worker | LazyWorker,
  options: UseWorkerFnOpts<FN> & {
    internal: boolean;
  },
): {
  fn: ProxyFn<FN>;
} {
  // options
  const { transfer, internal } = options;

  // states
  let callCount = 0;
  let callingCount = 0;

  // worker instance and its TTL
  let workerInst = worker instanceof Worker ? worker : undefined;
  let workerTtlTimeoutId: number | undefined;
  const ttl = worker instanceof Worker
    ? -1
    : worker.ttl === undefined
    ? 0
    : worker.ttl;

  // ensure the worker is initialized
  function ensureWorkerInitialized(worker: Worker) {
    const extended = worker as WorkerExtended<FN>;
    // check if is initialized
    if (extended[InitSymbol] !== true) {
      extended[InitSymbol] = true;
      extended[FnsSymbol] = {
        internal: new Map(),
        external: new Map(),
      };
    }
    // add a message listener
    extended.addEventListener("message", (event) => {
      // destructure the message from worker
      if (!isWorkerThreadMessage(event.data)) {
        return;
      }
      const { meta, ok, ret, err } = event.data as WorkerThreadMessage<FN>;
      const { internal, name, key } = meta;
      // get the promise callback
      const fns = internal
        ? extended[FnsSymbol].internal
        : extended[FnsSymbol].external;
      const promiseCbs = fns.get(name);
      if (!promiseCbs) {
        return;
      }
      const promiseCb = promiseCbs.get(key);
      if (!promiseCb) {
        return;
      }
      // remove the promise callback
      promiseCbs.delete(key);
      // update states
      callingCount--;
      // set a TTL timeout for the worker instance
      if (callingCount === 0 && ttl >= 0 && ttl !== Infinity) {
        const terminate = () => {
          workerInst?.terminate();
          workerInst = undefined;
        };
        clearTimeout(workerTtlTimeoutId);
        workerTtlTimeoutId = ttl === 0
          ? (terminate(), undefined)
          : setTimeout(terminate, ttl);
      }
      // resolve with the return value, or reject with the err
      const [resolve, reject] = promiseCb;
      if (ok) {
        resolve(ret);
      } else {
        reject(
          new Error(`The worker function "${name}" throws an exception.`, {
            cause: err,
          }),
        );
      }
    });
  }

  // return the current worker instance
  function getWorker() {
    workerInst = workerInst
      ? workerInst
      : worker instanceof Worker
      ? worker
      : worker.factory();
    ensureWorkerInitialized(workerInst);
    return workerInst;
  }

  // add a call promise callback to worker
  function addWorkerCallCallback(
    worker: Worker,
    key: number,
    callback: [(ret: Awaited<ReturnType<FN>>) => void, (err: any) => void],
  ) {
    const extended = worker as WorkerExtended<FN>;
    const fns = internal
      ? extended[FnsSymbol].internal
      : extended[FnsSymbol].external;
    let promiseCbs = fns.get(name);
    if (!promiseCbs) {
      promiseCbs = new Map();
      fns.set(name, promiseCbs);
    }
    promiseCbs.set(key, callback);
  }

  // the proxy function
  function fn(...args: Parameters<FN>) {
    return new Promise<AwaitedRet<FN>>((resolve, reject) => {
      // update states
      callCount++;
      callingCount++;
      // identify the current call
      const key = callCount;
      // stop the TTL timeout for the worker instance
      clearTimeout(workerTtlTimeoutId);
      // get the worker instance
      const workerInstCurr = getWorker();
      // add the promise callback to worker
      addWorkerCallCallback(workerInstCurr, key, [resolve, reject]);
      // post a call message to the worker
      workerInstCurr.postMessage(
        {
          meta: {
            internal,
            name,
            key,
          },
          args,
        } satisfies MainThreadMessage<FN>,
        {
          transfer: transfer?.({ args }),
        },
      );
    });
  }

  // return the proxy function
  return { fn };
}

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
  worker: Worker | LazyWorker,
  options: UseWorkerFnOpts<FN> = {},
): ProxyFn<FN> {
  const { fn } = use(name, worker, {
    ...options,
    internal: false, // ensure not internal
  });

  return fn;
}

/**
 * Invoke this function in the main thread to create proxy functions of all worker functions.
 *
 * @param worker - Either a Worker instance or an object containing options for creating a lazy Worker instance.
 * @returns Proxy functions.
 */
export function useWorkerFns<FNS extends Record<string, AnyFn>>(
  worker: Worker | LazyWorker,
): ProxyFns<FNS> {
  const fns = new Proxy({}, {
    get(_target, name) {
      if (typeof name !== "string") {
        throw new Error("The name must be a string.", { cause: name });
      }
      const { fn } = use(name, worker, { internal: false });
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
  const { fn: $names } = use<InternalFns["$names"]>("$names", worker, {
    internal: true,
  });

  return {
    names: await $names(),
  };
}
