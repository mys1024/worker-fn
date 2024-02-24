import { assertEquals } from "@std/assert";
import { useWorkerFn } from "../src/main.ts";
import type { add as $add, fib as $fib } from "./fns.test.worker.ts";

Deno.test("defineWorkerFns()", async () => {
  const worker = new Worker(new URL("./main.test.worker.ts", import.meta.url), {
    type: "module",
  });
  const add = useWorkerFn<typeof $add>("add", worker);
  const fib = useWorkerFn<typeof $fib>("fib", worker);
  assertEquals(await add(1, 2), 3);
  assertEquals(await add(5, 5), 10);
  assertEquals(await add(10, 20), 30);
  assertEquals(await fib(3), 2);
  assertEquals(await fib(5), 5);
});
