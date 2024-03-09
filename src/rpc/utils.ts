import {
  MsgPort,
  MsgPortNormalized,
  RpcCallMsg,
  RpcReturnMsg,
} from "./types.ts";

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects#supported_objects
 */
const transferableClasses = (function () {
  return [
    "ArrayBuffer",
    "MessagePort",
    "ReadableStream",
    "WritableStream",
    "TransformStream",
    "WebTransportReceiveStream",
    "WebTransportSendStream",
    "AudioData",
    "ImageBitmap",
    "VideoFrame",
    "OffscreenCanvas",
    "RTCDataChannel",
  ].map((name) => getGlobalVar(name)).filter((v) => !!v);
})();

export function getGlobalVar(name: string) {
  try {
    return Function(`return ${name}`)();
  } catch {
    return undefined;
  }
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
