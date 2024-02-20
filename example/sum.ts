import { useWorkerFn } from "jsr:@mys1024/worker-fn@1";
import type { Sum } from "./sum.worker.ts";

const { fn: sum } = useWorkerFn<Sum>({
  name: "sum",
  worker: new Worker(new URL("./sum.worker.ts", import.meta.url), {
    type: "module",
  }),
});

console.log(await sum(1, 2));
