/**
 * `worker-fn` hides the complexity of communication between the main thread and Worker threads,
 * making it easy to call functions defined in the Worker.
 */

export { defineWorkerFn, defineWorkerFns } from "./worker.ts";
export { inspectWorker, useWorkerFn, useWorkerFns } from "./proxy.ts";
