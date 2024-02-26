import type { MainThreadMessage, WorkerThreadMessage } from "./types.ts";

export function isMainThreadMessage(val: any): val is MainThreadMessage {
  return typeof val?.meta === "object" && Array.isArray(val?.args);
}

export function isWorkerThreadMessage(val: any): val is WorkerThreadMessage {
  return typeof val?.meta === "object" && typeof val?.ok === "boolean";
}
