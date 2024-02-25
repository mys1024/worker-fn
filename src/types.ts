export type AnyFn = (...args: any[]) => any;

export interface CallMeta {
  internal: boolean;
  name: string;
  key: number;
}

export type MainThreadMessage<FN extends AnyFn = AnyFn> = {
  meta: CallMeta;
  args: Parameters<FN>;
};

export type WorkerThreadMessage<FN extends AnyFn = AnyFn> =
  & { meta: CallMeta }
  & (
    | { ok: true; ret: Awaited<ReturnType<FN>>; err?: undefined }
    | { ok: false; ret?: undefined; err: any }
  );
