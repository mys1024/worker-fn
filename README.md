# worker-fn

[![GitHub License](https://img.shields.io/github/license/mys1024/worker-fn?&style=flat-square)](./LICENSE)
[![GitHub Tag](https://img.shields.io/github/v/tag/mys1024/worker-fn?sort=semver&style=flat-square&label=JSR&color=rgb(247%2C223%2C30))](https://jsr.io/@mys1024/worker-fn)
[![NPM Version](https://img.shields.io/npm/v/worker-fn?&style=flat-square)](https://www.npmjs.com/package/worker-fn)
[![NPM Downloads](https://img.shields.io/npm/dy/worker-fn?&style=flat-square)](https://www.npmjs.com/package/worker-fn)
[![GitHub Actions Workflow CI Status](https://img.shields.io/github/actions/workflow/status/mys1024/worker-fn/ci.yml?label=CI&&style=flat-square)](https://github.com/mys1024/worker-fn/actions/workflows/ci.yml)
[![GitHub Actions Workflow Release Status](https://img.shields.io/github/actions/workflow/status/mys1024/worker-fn/release.yml?label=Release&&style=flat-square)](https://github.com/mys1024/worker-fn/actions/workflows/release.yml)

English | [中文文档](./README_zh.md)

`worker-fn` hides the complexity of communication between the main thread and [Worker](https://developer.mozilla.org/docs/Web/API/Web_Workers_API) threads, making it easy to call functions defined in the Worker.

`worker-fn` allows you to create **proxy functions** in the JavaScript main thread that call corresponding **worker functions** defined in Worker threads. The proxy function has the same function signature as the worker function (except that the return value of the proxy function has to be wrapped in a Promise).

NOTICE: `worker-fn` is compatible with runtimes that support the [Web Workers API](https://developer.mozilla.org/docs/Web/API/Web_Workers_API), such as browsers and [Deno](https://deno.com), but is not compatible with `node:worker_threads` in Node.js.

## Usage

In `math.worker.ts`:

```typescript
import { defineWorkerFn } from "worker-fn";

function add(a: number, b: number) {
  return a + b;
}

function fib(n: number): number {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

defineWorkerFn("add", add);
defineWorkerFn("fib", fib);

export type Add = typeof add;
export type Fib = typeof fib;
```

In `math.ts`:

```typescript
import { useWorkerFn } from "worker-fn";
import type { Add, Fib } from "./math.worker.ts";

const worker = new Worker(new URL("./math.worker.ts", import.meta.url), {
  type: "module",
});

export const add = useWorkerFn<Add>("add", worker);
export const fib = useWorkerFn<Fib>("fib", worker);

console.log(await add(1, 2)); // 3
console.log(await fib(5)); // 5
```

## Importing from JSR

`worker-fn` is published on both [npm](https://www.npmjs.com/package/worker-fn) and [JSR](https://jsr.io/@mys1024/worker-fn).

If you are using Deno, you can import `worker-fn` from JSR:

```typescript
import { defineWorkerFn, useWorkerFn } from "jsr:@mys1024/worker-fn@2";
```

## License

MIT License &copy; 2024-PRESENT mys1024
