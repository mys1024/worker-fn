import { assertEquals } from "@std/assert";
import { useWorkerFn, useWorkerFns } from "../src/main.ts";
import type { Fns } from "./fns.test.worker.ts";

Deno.test("fns", async (t) => {
  await t.step("defineWorkerFns()", async () => {
    const worker = new Worker(
      new URL("./fns.test.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    const add = useWorkerFn<Fns["add"]>("add", worker);
    const fib = useWorkerFn<Fns["fib"]>("fib", worker);
    assertEquals(await add(1, 2), 3);
    assertEquals(await add(5, 5), 10);
    assertEquals(await add(10, 20), 30);
    assertEquals(await fib(3), 2);
    assertEquals(await fib(5), 5);
  });

  await t.step("useWorkerFns()", async () => {
    const worker = new Worker(
      new URL("./fns.test.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    const { add, fib } = useWorkerFns<Fns>(worker, {
      fib: {
        transfer: () => [],
      },
    });
    assertEquals(await add(1, 2), 3);
    assertEquals(await add(5, 5), 10);
    assertEquals(await add(10, 20), 30);
    assertEquals(await fib(3), 2);
    assertEquals(await fib(5), 5);
  });
});
