<div align="center">

# worker-fn

[![jsr-version](https://img.shields.io/jsr/v/@mys/worker-fn?style=flat-square&color=%23f7df1e)](https://jsr.io/@mys/worker-fn)
[![npm-version](https://img.shields.io/npm/v/worker-fn?style=flat-square&color=%23cb3837)](https://www.npmjs.com/package/worker-fn)
[![npm-minzip](https://img.shields.io/bundlephobia/minzip/worker-fn?style=flat-square&label=minzip)](https://bundlephobia.com/package/worker-fn)
[![docs](https://img.shields.io/badge/docs-reference-blue?style=flat-square)](https://jsr.io/@mys/worker-fn/doc?style=flat-square)
[![stars](https://img.shields.io/github/stars/mys1024/worker-fn?style=flat-square)](https://github.com/mys1024/worker-fn)
[![license](https://img.shields.io/github/license/mys1024/worker-fn?&style=flat-square)](./LICENSE)

[![workflow-ci](https://img.shields.io/github/actions/workflow/status/mys1024/worker-fn/ci.yml?label=ci&style=flat-square)](https://github.com/mys1024/worker-fn/actions/workflows/ci.yml)
[![workflow-release](https://img.shields.io/github/actions/workflow/status/mys1024/worker-fn/release.yml?label=release&style=flat-square)](https://github.com/mys1024/worker-fn/actions/workflows/release.yml)

English | [中文文档](./README_zh.md)

</div>

`worker-fn` hides the complexity of communication between the JavaScript main
thread and [Worker](https://developer.mozilla.org/docs/Web/API/Web_Workers_API)
threads, making it easy to call the functions defined in workers.

`worker-fn` allows you to create **proxy functions** in the main thread that
call corresponding **worker functions** defined in worker threads by sending
messages. These proxy functions maintain the same function signatures as the
corresponding worker functions (except that the return values of the proxy
functions are wrapped in Promises).

![concepts](./docs/concepts.png)

## Usage

### Basic

`math.worker.js`:

```javascript
import { defineWorkerFn } from "worker-fn";

function add(a, b) {
  return a + b;
}

function fib(n) {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

defineWorkerFn("add", add);
defineWorkerFn("fib", fib);
```

`math.js`:

```javascript
import { useWorkerFn } from "worker-fn";

const worker = new Worker(new URL("./math.worker.js", import.meta.url), {
  type: "module",
});

const add = useWorkerFn("add", worker);
const fib = useWorkerFn("fib", worker);

console.log(await add(1, 2)); // 3
console.log(await fib(5)); // 5
```

### Using `defineWorkerFns()` and `useWorkerFns()`

<details>

<summary>Example</summary>

`math.worker.js`:

```javascript
import { defineWorkerFns } from "worker-fn";

const fns = {
  add(a, b) {
    return a + b;
  },
  fib(n) {
    return n <= 2 ? 1 : fns.fib(n - 1) + fns.fib(n - 2);
  },
};

defineWorkerFns(fns);
```

`math.js`:

```javascript
import { useWorkerFns } from "worker-fn";

const worker = new Worker(new URL("./math.worker.js", import.meta.url), {
  type: "module",
});

const { add, fib } = useWorkerFns(worker);

console.log(await add(1, 2)); // 3
console.log(await fib(5)); // 5
```

</details>

### Using with TypeScript

<details>

<summary>Example</summary>

`math.worker.ts`:

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

`math.ts`:

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

</details>

### Using in Node.js with `node:worker_threads`

<details>

<summary>Example</summary>

`math.worker.js`:

```javascript
import { parentPort } from "node:worker_threads";
import { defineWorkerFn } from "worker-fn";

function add(a, b) {
  return a + b;
}

function fib(n) {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

defineWorkerFn("add", add, { port: parentPort });
defineWorkerFn("fib", fib, { port: parentPort });
```

`math.js`:

```javascript
import { Worker } from "node:worker_threads";
import { useWorkerFn } from "worker-fn";

const worker = new Worker(new URL("./math.worker.js", import.meta.url));

const add = useWorkerFn("add", worker);
const fib = useWorkerFn("fib", worker);

console.log(await add(1, 2)); // 3
console.log(await fib(5)); // 5
```

</details>

## Importing from JSR

`worker-fn` is published on both [npm](https://www.npmjs.com/package/worker-fn)
and [JSR](https://jsr.io/@mys/worker-fn). If you want to import `worker-fn` from
JSR, please refer to
[this document](https://jsr.io/docs/introduction#using-jsr-packages).

## License

[MIT](./LICENSE) License &copy; 2024-PRESENT
[mys1024](https://github.com/mys1024)
