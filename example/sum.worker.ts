import { defineWorkerFn } from "jsr:@mys1024/worker-fn@1";

export type Sum = (a: number, b: number) => number;

defineWorkerFn<Sum>({
  name: "sum",
  fn: (a, b) => a + b,
});
