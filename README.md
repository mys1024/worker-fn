# worker-fn

Run functions using Web Worker.

This package is currently compatible with browsers and Deno, but not with Node.js.

## Usage

In `sum.worker.ts`:

```typescript
import { defineWorkerFn } from 'worker-fn'

export type Sum = (a: number, b: number) => number

defineWorkerFn<Sum>({
  name: 'sum',
  fn: (a, b) => a + b,
})
```

In `sum.ts`:

```typescript
import { useWorkerFn } from 'worker-fn'
import type { Sum } from './sum.worker'

const { fn: sum } = useWorkerFn<Sum>({
  name: 'sum',
  worker: new Worker(new URL('./sum.worker.ts', import.meta.url), {
    type: 'module',
  }),
})

console.log(await sum(1, 2)) // 3
```

## License

MIT License © 2024 mys1024
