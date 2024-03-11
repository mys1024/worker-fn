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

function addBytesWithTransferring(
  buffer1: ArrayBuffer,
  buffer2: ArrayBuffer,
  length: number,
) {
  const bytes1 = new Uint8Array(buffer1);
  const bytes2 = new Uint8Array(buffer2);
  for (let i = 0; i < length; i++) {
    bytes1[i] += bytes2[i];
  }
  return new Promise<ArrayBuffer>((resolve) => {
    resolve(bytes1.buffer);
    setTimeout(() => {
      if (bytes1.buffer.byteLength !== 0) {
        throw new Error("The return value should be transferred.");
      }
    });
  });
}

function addBytesWithoutTransferring(
  buffer1: ArrayBuffer,
  buffer2: ArrayBuffer,
  length: number,
) {
  const bytes1 = new Uint8Array(buffer1);
  const bytes2 = new Uint8Array(buffer2);
  for (let i = 0; i < length; i++) {
    bytes1[i] += bytes2[i];
  }
  return new Promise<ArrayBuffer>((resolve) => {
    resolve(bytes1.buffer);
    setTimeout(() => {
      if (bytes1.buffer.byteLength === 0) {
        throw new Error("The return value should not be transferred.");
      }
    });
  });
}

defineWorkerFn("add", add);
defineWorkerFn("fib", fib);
defineWorkerFn("throwErr", throwErr);
defineWorkerFn("redefine", redefine);
defineWorkerFn("addBytesWithTransferring", addBytesWithTransferring, {
  transfer: true,
});
defineWorkerFn("addBytesWithoutTransferring", addBytesWithoutTransferring, {
  transfer: false,
});

export type Add = typeof add;
export type Fib = typeof fib;
export type ThrowErr = typeof throwErr;
export type Redefine = typeof redefine;
export type AddBytesWithTransferring = typeof addBytesWithTransferring;
export type AddBytesWithoutTransferring = typeof addBytesWithoutTransferring;
