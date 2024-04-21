import type {
  MRpcCallOptions,
  MRpcDefineOptions,
  NodeWorkerOrNodeMessagePort,
  RemoteFn,
  RemoteFns,
  WorkerGlobalScope,
} from "@mys/m-rpc";

/* -------------------------------------------------- common -------------------------------------------------- */

export type AnyFn = (...args: any[]) => any;

export type ProxyFn<FN extends AnyFn> = RemoteFn<FN>;

export type ProxyFns<FNS extends Record<string, AnyFn>> = RemoteFns<FNS>;

/* -------------------------------------------------- options -------------------------------------------------- */

/**
 * Options for calling a worker function.
 */
export interface CallOptions<FN extends AnyFn> extends MRpcCallOptions<FN> {
}

/**
 * Options for defining a worker function.
 */
export interface DefineOptions<FN extends AnyFn> extends MRpcDefineOptions<FN> {
  port?: WorkerGlobalScope | NodeWorkerOrNodeMessagePort;
}
