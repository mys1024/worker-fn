import { assertEquals } from "@std/assert";
import { useWorkerFn } from "../src/main.ts";
import type { Add, Fib, Redefine, ThrowErr } from "./main.test.worker.ts";
import type { Add as Add2 } from "./main.test.worker.another.ts";

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

Deno.test("err passthrough", async () => {
  const throwErr = useWorkerFn<ThrowErr>(
    "throwErr",
    new Worker(new URL("./main.test.worker.ts", import.meta.url), {
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

Deno.test("no undefined name", async () => {
  const undefinedName = useWorkerFn(
    "undefinedName",
    new Worker(new URL("./main.test.worker.ts", import.meta.url), {
      type: "module",
    }),
  );
  try {
    await undefinedName();
  } catch (err) {
    assertEquals(
      ((err as Error).cause as Error).message,
      'The name "undefinedName" is not defined.',
    );
  }
});

Deno.test("no redefined name", async () => {
  const redefine = useWorkerFn<Redefine>(
    "redefine",
    new Worker(new URL("./main.test.worker.ts", import.meta.url), {
      type: "module",
    }),
  );
  try {
    await redefine();
  } catch (err) {
    assertEquals(
      ((err as Error).cause as Error).message,
      'The name "redefine" has already been defined.',
    );
  }
});

Deno.test("isolation", async () => {
  const worker1 = new Worker(
    new URL("./main.test.worker.ts", import.meta.url),
    {
      type: "module",
    },
  );
  const worker2 = new Worker(
    new URL("./main.test.worker.another.ts", import.meta.url),
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
      'The name "fib" is not defined.',
    );
  }
});
