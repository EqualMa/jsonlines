import { Duplex, DuplexOptions, pipeline } from "stream";
import { drain } from "./drain";

export interface DuplexSimpleSource {
  writable: NodeJS.WritableStream;
  readable: NodeJS.ReadableStream;
}

export type DuplexSource = NodeJS.ReadWriteStream[] | DuplexSimpleSource;

type DuplexCallback = (error?: Error | null) => void;

export class DuplexBase extends Duplex {
  #readable: NodeJS.ReadableStream;
  #readSetup = false;
  #writable: NodeJS.WritableStream;

  constructor(source: DuplexSource, options: DuplexOptions) {
    super(options);
    if (Array.isArray(source)) {
      this.#writable = source[0] as NodeJS.WritableStream;
      this.#readable = source[source.length - 1] as NodeJS.ReadableStream;
      pipeline(source);
    } else {
      this.#writable = source.writable;
      this.#readable = source.readable;
    }
  }

  private async __writeAsync__(
    chunk: unknown,
    encoding: BufferEncoding,
    callback: DuplexCallback,
  ) {
    let errIsFromCallback = false;
    try {
      const writable = this.#writable;
      let resolve: () => void;
      let reject: (err: Error) => void;
      const p = new Promise((rsv, rjt) => {
        resolve = rsv;
        reject = rjt;
      });

      if (
        !writable.write(chunk as never, encoding, (err) => {
          if (err) reject(err);
          else resolve();
        })
      ) {
        await drain(writable);
      }

      await p;

      try {
        callback();
      } catch (err) {
        errIsFromCallback = true;
        throw err;
      }
    } catch (err) {
      if (!errIsFromCallback) callback(err);
      else throw err;
    }
  }

  _write(
    chunk: unknown,
    encoding: BufferEncoding,
    callback: DuplexCallback,
  ): void {
    void this.__writeAsync__(chunk, encoding, callback);
  }

  _read(size: number): void {
    if (!this.#readSetup) {
      const readable = this.#readable;
      readable
        .on("readable", () => {
          let chunk;
          while (null !== (chunk = readable.read(size))) {
            if (!this.push(chunk)) break;
          }
        })
        .on("end", () => {
          // EOF
          this.push(null);
        });

      this.#readSetup = true;
    }
  }

  _final(callback: DuplexCallback): void {
    const writable = this.#writable;
    writable.end(callback);
  }
}

export type AsyncValueGetter<V> = V | Promise<V> | (() => V | Promise<V>);

export type AsyncDuplexSource =
  | AsyncValueGetter<AsyncValueGetter<NodeJS.ReadWriteStream>[]>
  | AsyncValueGetter<{
      writable: AsyncValueGetter<NodeJS.WritableStream>;
      readable: AsyncValueGetter<NodeJS.ReadableStream>;
    }>;

function resolveAsyncValue<V>(v: AsyncValueGetter<V>): Promise<V> {
  return Promise.resolve<V>(
    typeof v === "function"
      ? //
        (v as () => V | Promise<V>)()
      : v,
  );
}

async function resolveAsyncDuplexSource(
  asyncSource: AsyncDuplexSource,
): Promise<DuplexSimpleSource> {
  const sc = await resolveAsyncValue(asyncSource);
  if (Array.isArray(sc)) {
    const streams = await Promise.all(sc.map((v) => resolveAsyncValue(v)));
    pipeline(streams);
    return {
      writable: streams[0] as NodeJS.WritableStream,
      readable: streams[streams.length - 1] as NodeJS.ReadableStream,
    };
  } else {
    const writable = await resolveAsyncValue(sc.writable);
    const readable = await resolveAsyncValue(sc.readable);
    return {
      writable,
      readable,
    };
  }
}

export class AsyncDuplexBase extends Duplex {
  constructor(asyncSource: AsyncDuplexSource, options: DuplexOptions) {
    super(options);
    this.#asyncSource = asyncSource;
  }

  #asyncSource: AsyncDuplexSource | undefined;
  #source: Promise<DuplexSimpleSource> | undefined;
  private setupSourceOnce(): Promise<{
    writable: NodeJS.WritableStream;
    readable: NodeJS.ReadableStream;
  }> {
    if (this.#source === undefined) {
      const asyncSource = this.#asyncSource;
      if (!asyncSource) throw new Error("invalid state");
      this.#source = resolveAsyncDuplexSource(asyncSource);
    }

    return this.#source;
  }

  private async __writeAsync__(
    chunk: unknown,
    encoding: BufferEncoding,
    callback: DuplexCallback,
  ) {
    let errIsFromCallback = false;
    try {
      const { writable } = await this.setupSourceOnce();
      let resolve: () => void;
      let reject: (err: Error) => void;
      const p = new Promise((rsv, rjt) => {
        resolve = rsv;
        reject = rjt;
      });

      if (
        !writable.write(chunk as never, encoding, (err) => {
          if (err) reject(err);
          else resolve();
        })
      ) {
        await drain(writable);
      }

      await p;

      try {
        callback();
      } catch (err) {
        errIsFromCallback = true;
        throw err;
      }
    } catch (err) {
      if (!errIsFromCallback) callback(err);
      else throw err;
    }
  }

  _write(
    chunk: unknown,
    encoding: BufferEncoding,
    callback: DuplexCallback,
  ): void {
    void this.__writeAsync__(chunk, encoding, callback);
  }

  #readSetup = false;
  _read(size: number): void {
    if (!this.#readSetup) {
      void this.setupSourceOnce().then(({ readable }) => {
        readable
          .on("readable", () => {
            let chunk;
            while (null !== (chunk = readable.read(size))) {
              if (!this.push(chunk)) break;
            }
          })
          .on("end", () => {
            // EOF
            this.push(null);
          });

        this.#readSetup = true;
      });
    }
  }

  _final(callback: DuplexCallback): void {
    void this.setupSourceOnce().then(({ writable }) => {
      writable.end(callback);
    });
  }
}
