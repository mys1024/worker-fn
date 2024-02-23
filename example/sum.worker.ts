import { defineWorkerFn } from "jsr:@mys1024/worker-fn@1";

function sum(a: number, b: number) {
  return a + b;
}

defineWorkerFn({ name: "sum", fn: sum });

export type Sum = typeof sum;
