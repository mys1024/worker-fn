import { assertEquals, assertIsError } from "@std/assert";
import { useWorkerFn } from "../src/main.ts";
import type { Add, Fib, ThrowErr } from "./basic.test.worker.ts";
import type { Add as Add2 } from "./basic.test.worker.another.ts";

Deno.test({
  name: "basic",
  sanitizeOps: false,
  fn: async (t) => {
    await t.step("useWorkerFn() and defineWorkerFn()", async (t) => {
      await t.step("basic", async () => {
        const worker = new Worker(
          new URL("./basic.test.worker.ts", import.meta.url),
          {
            type: "module",
          },
        );
        const add = useWorkerFn<Add>("add", worker);
        const fib = useWorkerFn<Fib>("fib", worker);
        assertEquals(await add(1, 2), 3);
        assertEquals(await add(5, 5), 10);
        assertEquals(await add(10, 20), 30);
        assertEquals(await fib(3), 2);
        assertEquals(await fib(5), 5);
      });

      await t.step("concurrency", async () => {
        const worker = new Worker(
          new URL("./basic.test.worker.ts", import.meta.url),
          {
            type: "module",
          },
        );
        const add = useWorkerFn<Add>("add", worker);
        assertEquals(
          await Promise.all([add(100, 200), add(50, 50), add(2, 8)]),
          [300, 100, 10],
        );
      });

      await t.step("err passthrough", async () => {
        const throwErr = useWorkerFn<ThrowErr>(
          "throwErr",
          new Worker(new URL("./basic.test.worker.ts", import.meta.url), {
            type: "module",
          }),
        );
        try {
          await throwErr("This is an error threw by the worker function!");
        } catch (err) {
          assertIsError(
            err,
            undefined,
            'The worker function "throwErr" throws an error.',
          );
          assertIsError(
            err.cause,
            undefined,
            "This is an error threw by the worker function!",
          );
        }
      });

      await t.step("multiple workers", async () => {
        const worker1 = new Worker(
          new URL("./basic.test.worker.ts", import.meta.url),
          {
            type: "module",
          },
        );
        const worker2 = new Worker(
          new URL("./basic.test.worker.another.ts", import.meta.url),
          {
            type: "module",
          },
        );
        const add1 = useWorkerFn<Add>("add", worker1);
        const add2 = useWorkerFn<Add2>("add", worker2);
        const fib2 = useWorkerFn("fib", worker2);
        assertEquals(await add1(1, 2), 3);
        assertEquals(await add2(3, 4), 7);
        try {
          await fib2();
        } catch (err) {
          assertEquals(
            ((err as Error).cause as Error).message,
            'The function name "fib" is not defined.',
          );
        }
      });
    });
  },
});
