import { defineWorkerFns } from "../src/main.ts";

const fns = {
  add(a: number, b: number) {
    return a + b;
  },
  fib(n: number): number {
    return n <= 2 ? 1 : fns.fib(n - 1) + fns.fib(n - 2);
  },
};

defineWorkerFns(fns);

export type Fns = typeof fns;
