import { assertEquals } from "@std/assert";
import { inspectWorker } from "../src/main.ts";

Deno.test("inspect", async (t) => {
  await t.step("inspectWorker()", async () => {
    const worker = new Worker(
      new URL("./inspect.test.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    const { names } = await inspectWorker(worker);
    assertEquals(names, ["add", "fib"]);
  });
});
