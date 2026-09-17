/**
 * A push-to-pull bridge.
 *
 * `ModelProvider.stream` is an `AsyncIterable`, because that is the shape the runtime wants
 * to consume; the network transport underneath is callback driven, because that is the
 * shape React Native's networking gives. This queue is the adapter between the two.
 *
 * It is written with an explicit iterator instead of an async generator: Hermes and the
 * Babel transform handle plain promises everywhere, with nothing to configure.
 */
export type AsyncQueue<T> = {
  push(value: T): void;
  fail(error: Error): void;
  close(): void;
  readonly iterable: AsyncIterable<T>;
};

type Waiter<T> = {
  resolve(result: IteratorResult<T, undefined>): void;
  reject(error: Error): void;
};

/**
 * @param onRelease called once, when the consumer stops iterating for any reason:
 * completion, failure, cancellation or an early `break`. This is where the transport is
 * torn down, so a stream nobody listens to does not keep the radio awake.
 */
export function createAsyncQueue<T>(onRelease?: () => void): AsyncQueue<T> {
  const values: T[] = [];
  const waiters: Array<Waiter<T>> = [];
  let failure: Error | null = null;
  let closed = false;
  let released = false;

  function release(): void {
    if (released) {
      return;
    }

    released = true;
    onRelease?.();
  }

  function settle(): void {
    while (waiters.length > 0) {
      const waiter = waiters[0];

      if (values.length > 0) {
        waiters.shift();
        waiter.resolve({done: false, value: values.shift() as T});
        continue;
      }

      if (failure !== null) {
        waiters.shift();
        release();
        waiter.reject(failure);
        continue;
      }

      if (closed) {
        waiters.shift();
        release();
        waiter.resolve({done: true, value: undefined});
        continue;
      }

      return;
    }
  }

  const iterator: AsyncIterator<T, undefined> = {
    next() {
      if (values.length > 0) {
        return Promise.resolve({done: false, value: values.shift() as T});
      }

      if (failure !== null) {
        release();
        return Promise.reject(failure);
      }

      if (closed) {
        release();
        return Promise.resolve({done: true, value: undefined});
      }

      return new Promise<IteratorResult<T, undefined>>((resolve, reject) => {
        waiters.push({resolve, reject});
      });
    },

    return() {
      closed = true;
      values.length = 0;
      release();
      settle();

      return Promise.resolve({done: true, value: undefined});
    },
  };

  return {
    push(value) {
      if (closed || failure !== null) {
        return;
      }

      values.push(value);
      settle();
    },

    fail(error) {
      if (closed || failure !== null) {
        return;
      }

      failure = error;
      settle();
    },

    close() {
      if (closed || failure !== null) {
        return;
      }

      closed = true;
      settle();
    },

    iterable: {
      [Symbol.asyncIterator]: () => iterator,
    },
  };
}
