import { Worker as NodeWorker } from "node:worker_threads";
import { assertEquals } from "@std/assert";
import { useWorkerFn } from "../src/main.ts";
import type { Add, Fib } from "./node.test.worker.ts";

Deno.test({
  name: "node",
  sanitizeOps: false,
  fn: async (t) => {
    await t.step("basic", async () => {
      const worker = new NodeWorker(
        new URL("./node.test.worker.ts", import.meta.url),
      );
      const add = useWorkerFn<Add>("add", worker);
      const fib = useWorkerFn<Fib>("fib", worker);
      assertEquals(await add(1, 2), 3);
      assertEquals(await add(5, 5), 10);
      assertEquals(await add(10, 20), 30);
      assertEquals(await fib(3), 2);
      assertEquals(await fib(5), 5);
    });
  },
});
