/**
 * worker-fn hides the complexity of communication between the JavaScript main thread and Worker threads,
 * making it easy to call the functions defined in workers.
 */

export { defineWorkerFn, defineWorkerFns } from "./define.ts";
export { inspectWorker, useWorkerFn, useWorkerFns } from "./use.ts";
