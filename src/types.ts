export type AnyFn = (...args: any[]) => any;

export type MainThreadMessage<FN extends AnyFn = AnyFn> = {
  internal: boolean;
  key: number;
  name: string;
  args: Parameters<FN>;
};

export type WorkerThreadMessage<FN extends AnyFn = AnyFn> =
  & {
    internal: boolean;
    key: number;
    name: string;
  }
  & (
    | { ok: true; ret: Awaited<ReturnType<FN>>; err?: undefined }
    | { ok: false; ret?: undefined; err: any }
  );
