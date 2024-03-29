import { defineWorkerFn } from "../src/main.ts";

function add(a: number, b: number) {
  return a + b;
}

defineWorkerFn("add", add);

export type Add = typeof add;
