import { AsyncDuplexBase } from "./util/duplex-base";
import { Transform, TransformCallback } from "stream";
import { JsonLinesGzipOption } from "./parse";
import { LineSepOption, getLineSepString } from "./util/line-sep";

export interface JsonLinesStringifyOptions<V> {
  /**
   * specify the encoding to encode string to buffer
   *
   * NOTE that [the standard jsonlines](http://jsonlines.org/)
   * requires `utf8` as file encoding
   *
   * Defaults to `utf8`
   */
  encoding?: BufferEncoding;

  /**
   * specify a function to stringify values.
   * It accepts a value as parameter,
   * and should return a string or a Promise<string>.
   *
   * Defaults to `JSON.stringify`
   */
  stringify?: (v: V) => string | Promise<string>;

  /**
   * specify whether to gzip the output
   *
   * Omit or use `false` to disable gzip.
   * Use `true` to gzip with default options.
   * Or use an object as params for `require('zlib').createGzip`
   */
  gzip?: JsonLinesGzipOption;

  /**
   * specify the line ending to be used in the output
   *
   * NOTE that [the standard jsonlines](http://jsonlines.org/)
   * requires `\n` as line separator
   *
   * Defaults to `\n`
   */
  lineSep?: LineSepOption;
}

export class JsonLinesStringifyStream<V> extends Transform {
  #stringify: (v: V) => string | Promise<string>;

  readonly encoding: BufferEncoding;
  readonly lineSep: string;

  constructor(options?: JsonLinesStringifyOptions<V>) {
    super({
      writableObjectMode: true,
    });

    this.encoding = options?.encoding ?? "utf8";
    this.lineSep = getLineSepString(options?.lineSep ?? "lf");
    this.#stringify = options?.stringify ?? JSON.stringify;
  }

  private async _transformAsync(chunk: V) {
    const str = await this.#stringify(chunk);
    const buf = Buffer.from(str + this.lineSep, this.encoding);
    this.push(buf);
  }

  _transform(chunk: V, encoding: unknown, callback: TransformCallback): void {
    this._transformAsync(chunk)
      .then(() => callback())
      .catch((err) => callback(err));
  }
}

export class JsonLinesStringifyStreamWithGzip<
  V = unknown
> extends AsyncDuplexBase {
  constructor(options?: JsonLinesStringifyOptions<V>) {
    const gzip = options?.gzip;

    const stringifyStream = new JsonLinesStringifyStream(options);

    super(
      {
        readable: gzip
          ? () =>
              import("zlib").then((zlib) => {
                const gzipStream = zlib.createGzip(
                  gzip === true ? undefined : gzip,
                );
                stringifyStream.pipe(gzipStream);
                return gzipStream;
              })
          : stringifyStream,
        writable: stringifyStream,
      },
      { readableObjectMode: true, writableObjectMode: false },
    );
  }
}

export function stringify<V>(
  options?: JsonLinesStringifyOptions<V>,
): JsonLinesStringifyStream<V> | JsonLinesStringifyStreamWithGzip<V> {
  if (options?.gzip) {
    return new JsonLinesStringifyStreamWithGzip(options);
  } else {
    return new JsonLinesStringifyStream(options);
  }
}
