import { defineWorkerFns } from "../src/main.ts";

export function add(a: number, b: number) {
  return a + b;
}

export function fib(n: number): number {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

export type Fns = {
  add: typeof add;
  fib: typeof fib;
};

defineWorkerFns({
  add,
  fib,
});
