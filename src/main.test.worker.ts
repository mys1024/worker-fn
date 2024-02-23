import { defineWorkerFn } from "./main.ts";

function sum(a: number, b: number) {
  return a + b;
}

defineWorkerFn({ name: "sum", fn: sum });

export type Sum = typeof sum;
