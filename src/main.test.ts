import { assertEquals } from "@std/assert";
import type { Sum } from "./main.test.worker.ts";
import { useWorkerFn } from "./main.ts";

Deno.test("basic", async () => {
  const worker = new Worker(new URL("./main.test.worker.ts", import.meta.url), {
    type: "module",
  });

  const sum = useWorkerFn<Sum>("sum", worker);
  assertEquals(await sum(1, 2), 3);

  worker.terminate();
});

Deno.test("factory", async () => {
  const sum = useWorkerFn<Sum>("sum", {
    factory: () =>
      new Worker(new URL("./main.test.worker.ts", import.meta.url), {
        type: "module",
      }),
  });

  assertEquals(await sum(5, 5), 10);
});
