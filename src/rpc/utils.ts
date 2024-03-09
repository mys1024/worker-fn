import {
  MsgPort,
  MsgPortNormalized,
  RpcCallMsg,
  RpcReturnMsg,
} from "./types.ts";

const _global = getGlobal();

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects#supported_objects
 */
const transferableClasses = [
  _global.ArrayBuffer,
  _global.MessagePort,
  _global.ReadableStream,
  _global.WritableStream,
  _global.TransformStream,
  _global.WebTransportReceiveStream,
  _global.WebTransportSendStream,
  _global.AudioData,
  _global.ImageBitmap,
  _global.VideoFrame,
  _global.OffscreenCanvas,
  _global.RTCDataChannel,
].filter((c) => !!c);

export function getGlobal() {
  const globalNames = ["globalThis", "self", "window", "global"];
  for (const name of globalNames) {
    try {
      const g = eval(name);
      if (g) {
        return g;
      }
    } catch {
      continue;
    }
  }
  throw new Error("Failed to get the global object.");
}

export function isTransferable(val: any): val is Transferable {
  return transferableClasses.some((c) => val instanceof c);
}

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
