import { defineWorkerFn } from "../src/main.ts";

function add(a: number, b: number) {
  return a + b;
}

function fib(n: number): number {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

function throwErr(msg: string) {
  throw new Error(msg);
}

function redefine() {
  defineWorkerFn("redefine", redefine);
}

defineWorkerFn("add", add);
defineWorkerFn("fib", fib);
defineWorkerFn("throwErr", throwErr);
defineWorkerFn("redefine", redefine);

export type Add = typeof add;
export type Fib = typeof fib;
export type ThrowErr = typeof throwErr;
export type Redefine = typeof redefine;
