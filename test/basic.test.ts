import { assertEquals } from "@std/assert";
import { useWorkerFn } from "../src/main.ts";
import type {
  Add,
  AddBytesWithoutTransferring,
  AddBytesWithTransferring,
  Fib,
  Redefine,
  ThrowErr,
} from "./basic.test.worker.ts";
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

      await t.step("multiple proxy functions", async () => {
        const worker = new Worker(
          new URL("./basic.test.worker.ts", import.meta.url),
          {
            type: "module",
          },
        );

        const add1 = useWorkerFn<Add>("add", worker);
        const add2 = useWorkerFn<Add>("add", worker);
        const add3 = useWorkerFn<Add>("add", worker);
        const results = Promise.all([add1(100, 200), add2(50, 50), add3(2, 8)]);
        const timeout = new Promise((_, reject) => {
          setTimeout(() => {
            reject("timeout!");
          }, 500);
        });
        assertEquals(
          await Promise.race([results, timeout]),
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
          assertEquals(
            (err as Error).message,
            'The worker function "throwErr" throws an exception.',
          );
        }
      });

      await t.step("no undefined name", async () => {
        const undefinedName = useWorkerFn(
          "undefinedName",
          new Worker(new URL("./basic.test.worker.ts", import.meta.url), {
            type: "module",
          }),
        );
        try {
          await undefinedName();
        } catch (err) {
          assertEquals(
            ((err as Error).cause as Error).message,
            'The name "undefinedName" is not defined in namespace "fn".',
          );
        }
      });

      await t.step("no redefined name", async () => {
        const redefine = useWorkerFn<Redefine>(
          "redefine",
          new Worker(new URL("./basic.test.worker.ts", import.meta.url), {
            type: "module",
          }),
        );
        try {
          await redefine();
        } catch (err) {
          assertEquals(
            ((err as Error).cause as Error).message,
            'The name "redefine" has already been defined in namespace "fn".',
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
            'The name "fib" is not defined in namespace "fn".',
          );
        }
      });

      await t.step("transferring enabled", async () => {
        const worker = new Worker(
          new URL("./basic.test.worker.ts", import.meta.url),
          {
            type: "module",
          },
        );
        const addBytesWithTransferring = useWorkerFn<AddBytesWithTransferring>(
          "addBytesWithTransferring",
          worker,
          {
            transfer: true,
          },
        );
        const bytes1 = new Uint8Array([1, 2, 3]).buffer;
        const bytes2 = new Uint8Array([3, 2, 1]).buffer;
        assertEquals(
          Array.from(
            new Uint8Array(await addBytesWithTransferring(bytes1, bytes2, 3)),
          ),
          [4, 4, 4],
        );
        assertEquals(bytes1.byteLength, 0);
        assertEquals(bytes2.byteLength, 0);
      });

      await t.step("transferring disabled", async () => {
        const worker = new Worker(
          new URL("./basic.test.worker.ts", import.meta.url),
          {
            type: "module",
          },
        );
        const addBytesWithoutTransferring = useWorkerFn<
          AddBytesWithoutTransferring
        >("addBytesWithoutTransferring", worker, {
          transfer: false,
        });
        const bytes1 = new Uint8Array([1, 2, 3]).buffer;
        const bytes2 = new Uint8Array([3, 2, 1]).buffer;
        assertEquals(
          Array.from(
            new Uint8Array(
              await addBytesWithoutTransferring(bytes1, bytes2, 3),
            ),
          ),
          [4, 4, 4],
        );
        assertEquals(bytes1.byteLength, 3);
        assertEquals(bytes2.byteLength, 3);
      });
    });
  },
});
