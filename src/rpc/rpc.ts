import type {
  AnyFn,
  AwaitedRet,
  MsgPort,
  MsgPortNormalized,
  RpcCallMsg,
  RpcReturnMsg,
} from "./types.ts";
import {
  isRpcCallMsg,
  isRpcReturnMsg,
  isTransferable,
  toMsgPortNormalized,
} from "./utils.ts";

const DEFAULT_NAMESPACE = "rpc";
const RPC_AGENT_SYM = Symbol("RPC_AGENT_SYM");

export class RpcAgent {
  #msgPort: MsgPortNormalized;

  /** namespace -> name -> fnConf */
  #localFns = new Map<
    string,
    Map<string, {
      fn: AnyFn;
      transfer: boolean;
    }>
  >();

  /** namespace -> key -> callCtx */
  #remoteFnCalls = new Map<
    string,
    Map<number, {
      resolve: (ret: any) => void;
      reject: (err: any) => void;
    }>
  >();

  static getRpcAgent(msgPort: MsgPort): RpcAgent {
    return (msgPort as any)[RPC_AGENT_SYM] || new RpcAgent(msgPort);
  }

  constructor(msgPort: MsgPort) {
    // prevent double usage
    if ((msgPort as any)[RPC_AGENT_SYM]) {
      throw new Error(
        "The MsgPort has already been used by another RpcAgent instance, invoke `RpcAgent.getRpcAgent()` to get that RpcAgent instance instead.",
      );
    }
    (msgPort as any)[RPC_AGENT_SYM] = this;
    // init properties
    this.#msgPort = toMsgPortNormalized(msgPort);
    // start listening to messages
    this.#startListening();
  }

  defineLocalFn(name: string, fn: AnyFn, options: {
    namespace?: string;
    transfer?: boolean;
  } = {}) {
    const { namespace = DEFAULT_NAMESPACE, transfer = true } = options;

    const nameFnMap = this.#getNameFnMap(namespace, true);

    if (nameFnMap.has(name)) {
      throw new Error(
        `The name "${name}" has already been defined in namespace "${namespace}".`,
      );
    } else {
      nameFnMap.set(name, { fn, transfer });
    }
  }

  callRemoteFn<FN extends AnyFn>(name: string, options: {
    namespace?: string;
    args?: Parameters<FN>;
    transfer?: (args: Parameters<FN>) => Transferable[];
  } = {}) {
    const { namespace = DEFAULT_NAMESPACE, args = [], transfer } = options;

    const keyCallMap = this.#getKeyCallMap(namespace, true);

    const key = Math.random();
    const ret = new Promise<AwaitedRet<FN>>((resolve, reject) => {
      keyCallMap.set(key, { resolve, reject });
    });

    this.#sendCallMsg({
      meta: {
        ns: namespace,
        name,
        key,
      },
      type: "call",
      args,
    }, {
      transfer: transfer?.(args as any),
    });

    return ret;
  }

  getLocalFnNames(namespace = DEFAULT_NAMESPACE) {
    const nameFnMap = this.#getNameFnMap(namespace, false);
    return nameFnMap ? Array.from(nameFnMap.keys()) : [];
  }

  #getNameFnMap<E extends boolean>(namespace: string, ensure: E) {
    let nameFnMap = this.#localFns.get(namespace);
    if (!nameFnMap && ensure) {
      nameFnMap = new Map();
      this.#localFns.set(namespace, nameFnMap);
    }
    return nameFnMap as E extends true ? Exclude<typeof nameFnMap, undefined>
      : typeof nameFnMap;
  }

  #getKeyCallMap<E extends boolean>(namespace: string, ensure: E) {
    let keyCallMap = this.#remoteFnCalls.get(namespace);
    if (!keyCallMap && ensure) {
      keyCallMap = new Map();
      this.#remoteFnCalls.set(namespace, keyCallMap);
    }
    return keyCallMap as E extends true ? Exclude<typeof keyCallMap, undefined>
      : typeof keyCallMap;
  }

  #sendCallMsg(msg: RpcCallMsg, options: {
    transfer?: Transferable[];
  } = {}) {
    const { transfer } = options;
    this.#msgPort.postMessage(msg, { transfer });
  }

  #sendReturnMsg(msg: RpcReturnMsg, options: {
    transfer?: Transferable[];
  } = {}) {
    const { transfer } = options;
    this.#msgPort.postMessage(msg, { transfer });
  }

  #startListening() {
    this.#msgPort.addEventListener("message", async (event) => {
      if (isRpcCallMsg(event.data)) {
        const { meta, args } = event.data;
        const { ns, name } = meta;
        // get the local function
        const nameFnMap = this.#getNameFnMap(ns, false);
        if (!nameFnMap) {
          this.#sendReturnMsg({
            meta,
            type: "return",
            ok: false,
            err: new Error(`The namespace "${ns}" is not defined.`),
          });
          return;
        }
        const fnConf = nameFnMap.get(name);
        if (!fnConf) {
          this.#sendReturnMsg({
            meta,
            type: "return",
            ok: false,
            err: new Error(
              `The name "${name}" is not defined in namespace "${ns}".`,
            ),
          });
          return;
        }
        const { fn, transfer } = fnConf;
        // invoke the local function
        try {
          const ret = await fn(...args);
          this.#sendReturnMsg({
            meta,
            type: "return",
            ok: true,
            ret,
          }, {
            transfer: transfer && isTransferable(ret) ? [ret] : undefined,
          });
        } catch (err) {
          this.#sendReturnMsg({
            meta,
            type: "return",
            ok: false,
            err,
          });
        }
      } else if (isRpcReturnMsg(event.data)) {
        const { meta, ok, ret, err } = event.data;
        const { ns, name, key } = meta;
        // get the promise resolvers
        const keyCallMap = this.#getKeyCallMap(ns, false);
        if (!keyCallMap) {
          return;
        }
        const callCtx = keyCallMap.get(key);
        if (!callCtx) {
          return;
        }
        // resolve the promise
        const { resolve, reject } = callCtx;
        if (ok) {
          resolve(ret);
        } else {
          reject(
            new Error(`The worker function "${name}" throws an exception.`, {
              cause: err,
            }),
          );
        }
        // clean up
        keyCallMap.delete(key);
      }
    });
  }
}
