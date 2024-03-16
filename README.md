<div align="center">

# worker-fn

[![license](https://img.shields.io/github/license/mys1024/worker-fn?&style=flat-square)](./LICENSE)
[![jsr-version](https://img.shields.io/github/v/tag/mys1024/worker-fn?sort=semver&style=flat-square&label=jsr&color=rgb(247%2C223%2C30))](https://jsr.io/@mys/worker-fn)
[![npm-version](https://img.shields.io/npm/v/worker-fn?style=flat-square&color=rgb(203%2C56%2C55))](https://www.npmjs.com/package/worker-fn)
[![npm-minzip](https://img.shields.io/bundlephobia/minzip/worker-fn?style=flat-square&label=minzip)](https://bundlephobia.com/package/worker-fn)
[![npm-downloads](https://img.shields.io/npm/dy/worker-fn?&style=flat-square)](https://www.npmjs.com/package/worker-fn)
[![workflow-ci](https://img.shields.io/github/actions/workflow/status/mys1024/worker-fn/ci.yml?label=ci&style=flat-square)](https://github.com/mys1024/worker-fn/actions/workflows/ci.yml)
[![workflow-release](https://img.shields.io/github/actions/workflow/status/mys1024/worker-fn/release.yml?label=release&style=flat-square)](https://github.com/mys1024/worker-fn/actions/workflows/release.yml)

English | [中文文档](./README_zh.md)

</div>

`worker-fn` hides the complexity of communication between the JavaScript main thread and [Worker](https://developer.mozilla.org/docs/Web/API/Web_Workers_API) threads, making it easy to call the functions defined in workers.

`worker-fn` allows you to create **proxy functions** in the main thread that call the corresponding **worker functions** defined in Worker threads through message events. Proxy functions have the same function signatures as the corresponding worker functions (except that the return values of proxy functions will be wrapped in Promises).

![concepts](./docs/concepts.png)

## Usage

### Basic

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

const add = useWorkerFn<Add>("add", worker);
const fib = useWorkerFn<Fib>("fib", worker);

console.log(await add(1, 2)); // 3
console.log(await fib(5)); // 5
```

### Using in Node.js with `node:worker_threads`

<details>

<summary>Example</summary>

In `math.worker.ts`:

```typescript
import { parentPort } from "node:worker_threads";
import { defineWorkerFn } from "worker-fn";

function add(a: number, b: number) {
  return a + b;
}

function fib(n: number): number {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

defineWorkerFn("add", add, { port: parentPort! });
defineWorkerFn("fib", fib, { port: parentPort! });

export type Add = typeof add;
export type Fib = typeof fib;
```

In `math.ts`:

```typescript
import { Worker } from "node:worker_threads";
import { useWorkerFn } from "worker-fn";
import type { Add, Fib } from "./math.worker.ts";

const worker = new Worker(new URL("./math.worker.ts", import.meta.url));

const add = useWorkerFn<Add>("add", worker);
const fib = useWorkerFn<Fib>("fib", worker);

console.log(await add(1, 2)); // 3
console.log(await fib(5)); // 5
```

</details>

### `defineWorkerFns()` and `useWorkerFns()`

<details>

<summary>Example</summary>

In `math.worker.ts`:

```typescript
import { defineWorkerFns } from "worker-fn";

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
```

In `math.ts`:

```typescript
import { useWorkerFns } from "worker-fn";
import type { Fns } from "./math.worker.ts";

const worker = new Worker(new URL("./math.worker.ts", import.meta.url), {
  type: "module",
});

const { add, fib } = useWorkerFns<Fns>(worker);

console.log(await add(1, 2)); // 3
console.log(await fib(5)); // 5
```

</details>

## Importing from JSR

`worker-fn` is published on both [npm](https://www.npmjs.com/package/worker-fn) and [JSR](https://jsr.io/@mys/worker-fn). If you want to import `worker-fn` from JSR, please refer to [this document](https://jsr.io/docs/introduction#using-jsr-packages).

## License

MIT License &copy; 2024-PRESENT mys1024
