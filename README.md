# worker-fn

Run functions using Web Worker.

This package is currently compatible with browsers and Deno, but not with Node.js.

## Usage

In `sum.worker.ts`:

```typescript
import { defineWorkerFn } from "jsr:@mys1024/worker-fn@1";

export type Sum = (a: number, b: number) => number;

defineWorkerFn<Sum>({
  name: "sum",
  fn: (a, b) => a + b,
});
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

console.log(await sum(1, 2));
```

## License

MIT License © 2024-present mys1024
