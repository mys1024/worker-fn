import {
  MsgPort,
  MsgPortNormalized,
  RpcCallMsg,
  RpcReturnMsg,
} from "./types.ts";

export function isRpcCallMsg(val: any): val is RpcCallMsg {
  return val?.type === "call";
}

export function isRpcReturnMsg(val: any): val is RpcReturnMsg {
  return val?.type === "return";
}

export function toMsgPortNormalized(msgPort: MsgPort): MsgPortNormalized {
  return "on" in msgPort
    ? {
      postMessage: (msg) => msgPort.postMessage(msg),
      addEventListener: (type, listener) =>
        msgPort.on(type, (value) => listener({ data: value })),
    }
    : msgPort;
}
