import { assertEquals } from "@std/assert";
import { useWorkerFn } from "./main.ts";
import type { Add, Fib } from "./main.test.worker.ts";

Deno.test("basic", async () => {
  const worker = new Worker(new URL("./main.test.worker.ts", import.meta.url), {
    type: "module",
  });
  const add = useWorkerFn<Add>("add", worker);
  const fib = useWorkerFn<Fib>("fib", worker);
  assertEquals(await add(1, 2), 3);
  assertEquals(await add(5, 5), 10);
  assertEquals(await add(10, 20), 30);
  assertEquals(await fib(3), 2);
  assertEquals(await fib(5), 5);
});

Deno.test("lazy worker", async () => {
  const add = useWorkerFn<Add>("add", {
    factory: () =>
      new Worker(new URL("./main.test.worker.ts", import.meta.url), {
        type: "module",
      }),
  });
  assertEquals(await add(1, 2), 3);
  assertEquals(await add(5, 5), 10);
  assertEquals(await add(10, 20), 30);
});
