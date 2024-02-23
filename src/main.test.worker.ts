import { defineWorkerFn } from "./main.ts";

function sum(a: number, b: number) {
  return a + b;
}

defineWorkerFn<Sum>("sum", sum);

export type Sum = typeof sum;
