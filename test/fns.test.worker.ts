import { defineWorkerFns } from "../src/main.ts";

export function add(a: number, b: number) {
  return a + b;
}

export function fib(n: number): number {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

defineWorkerFns({
  add,
  fib,
});
