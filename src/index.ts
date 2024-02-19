export function useWorkerFn<FN extends (...args: any[]) => any>(options: {
  name: string
  worker: Worker | {
    factory: () => Worker
    /**
     * @default false
     */
    eager?: boolean
  }
}): {
    fn: (...args: Parameters<FN>) => Promise<Awaited<ReturnType<FN>>>
  } {
  const { name, worker: _worker } = options
  const eagerWorker = _worker instanceof Worker ? _worker : _worker.eager ? _worker.factory() : undefined

  function fn(...args: Parameters<FN>) {
    return new Promise<Awaited<ReturnType<FN>>>((resolve) => {
      const key = Math.random()
      const isLazy = !eagerWorker
      const worker = eagerWorker || (_worker as {
        factory: () => Worker
      }).factory()

      const handler = (event: MessageEvent<{ key: number; name: string; ret: Awaited<ReturnType<FN>> }>) => {
        const { key: receivedKey, ret } = event.data
        if (receivedKey !== key)
          return
        worker.removeEventListener('message', handler)
        resolve(ret)
        if (isLazy)
          worker.terminate()
      }

      worker.addEventListener('message', handler)
      worker.postMessage({
        key,
        name,
        args,
      })
    })
  }

  return {
    fn,
  }
}

export function defineWorkerFn<FN extends (...args: any[]) => any>(options: {
  name: string
  fn: FN
  /**
   * Transfer return value or not. Transfer when the return value is of type `ArrayBuffer` by default.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage#transfer
   */
  transfer?: boolean
}): void {
  const { name, fn, transfer: _transfer } = options

  addEventListener('message', async (event) => {
    const { key, name: receivedName, args } = event.data as { key: number; name: string; args: Parameters<FN> }

    if (receivedName !== name)
      return
    const ret = await fn(...args)

    const transfer = typeof _transfer === 'boolean'
      ? _transfer
        ? [ret] as Transferable[]
        : undefined
      : ret instanceof ArrayBuffer
        ? [ret]
        : undefined

    postMessage({
      key,
      name,
      ret,
    }, transfer as any)
  })
}
