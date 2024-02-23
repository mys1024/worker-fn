# worker-fn

Creating and invoking mirrored **proxy functions** in the JavaScript main thread to execute the corresponding **actual functions** in the worker thread.

This package is compatible with browsers and [Deno](https://deno.com/), but not with Node.js.

## Usage

In `sum.worker.ts`:

```typescript
import { defineWorkerFn } from "jsr:@mys1024/worker-fn@1";

function sum(a: number, b: number) {
  return a + b;
}

defineWorkerFn({ name: "sum", fn: sum });

export type Sum = typeof sum;
```

In `sum.ts`:

```typescript
import { useWorkerFn } from "jsr:@mys1024/worker-fn@1";
import type { Sum } from "./sum.worker.ts";

const { fn: sum } = useWorkerFn<Sum>({
  name: "sum",
  worker: new Worker(new URL("./sum.worker.ts", import.meta.url), {
    type: "module",
  }),
});

console.log(await sum(1, 2)); // 3
```

## License

MIT License © 2024-PRESENT mys1024
