import { defineWorkerFn } from "./main.ts";

export type Sum = (a: number, b: number) => number;

defineWorkerFn<Sum>({
  name: "sum",
  fn: (a, b) => a + b,
});
