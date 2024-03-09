/* -------------------------------------------------- general -------------------------------------------------- */

export type AnyFn = (...args: any[]) => any;

export type AwaitedRet<FN extends AnyFn> = Awaited<ReturnType<FN>>;

/* -------------------------------------------------- msg -------------------------------------------------- */

export interface MsgPortNormalized {
  postMessage(
    message: any,
    options?: {
      transfer?: Transferable[];
    },
  ): void;
  addEventListener: (
    type: "message",
    listener: (event: { data: any }) => any,
  ) => void;
}

export interface MsgPortNode {
  postMessage(value: any): void;
  on(event: "message", listener: (value: any) => void): void;
}

export type MsgPort = MsgPortNormalized | MsgPortNode;

/* -------------------------------------------------- RPC -------------------------------------------------- */

export interface RpcMeta {
  ns: string;
  name: string;
  key: number;
}

export type RpcCallMsg<FN extends AnyFn = AnyFn> = {
  meta: RpcMeta;
  type: "call";
  args: Parameters<FN>;
};

export type RpcReturnMsg<FN extends AnyFn = AnyFn> =
  & { meta: RpcMeta; type: "return" }
  & (
    | { ok: true; ret: Awaited<ReturnType<FN>>; err?: undefined }
    | { ok: false; ret?: undefined; err: any }
  );
