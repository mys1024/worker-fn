import { defineWorkerFn } from "./main.ts";

function add(a: number, b: number) {
  return a + b;
}

function fib(n: number): number {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

function throwErr(msg: string) {
  throw new Error(msg);
}

defineWorkerFn("add", add);
defineWorkerFn("fib", fib);
defineWorkerFn("throwErr", throwErr);

export type Add = typeof add;
export type Fib = typeof fib;
export type ThrowErr = typeof throwErr;
