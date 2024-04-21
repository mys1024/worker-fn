import type {
  MRpcCallOptions,
  MRpcDefineOptions,
  NodeWorkerOrNodeMessagePort,
} from "@mys/m-rpc";

/* -------------------------------------------------- common -------------------------------------------------- */

export type AnyFn = (...args: any[]) => any;

export type AwaitedRet<FN extends AnyFn> = Awaited<ReturnType<FN>>;

export type ProxyFn<FN extends AnyFn> = (
  ...args: Parameters<FN>
) => Promise<AwaitedRet<FN>>;

export type ProxyFns<FNS extends Record<string, AnyFn>> = {
  [P in keyof FNS]: ProxyFn<FNS[P]>;
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope
 */
export interface WorkerGlobalScope {
  self: WorkerGlobalScope; // for preventing type error
  postMessage: Worker["postMessage"];
  addEventListener: Worker["addEventListener"];
  removeEventListener: Worker["removeEventListener"];
}

/* -------------------------------------------------- options -------------------------------------------------- */

export interface CallOptions<FN extends AnyFn> extends MRpcCallOptions<FN> {
}

export interface DefineOptions<FN extends AnyFn> extends MRpcDefineOptions<FN> {
  port?: WorkerGlobalScope | NodeWorkerOrNodeMessagePort;
}
