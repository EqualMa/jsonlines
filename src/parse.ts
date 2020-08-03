import { AsyncDuplexBase } from "./util/duplex-base";
import { ReadLineStream, ReadLineStreamOptions } from "./readline-stream";

export type JsonLinesGzipOption = boolean | import("zlib").ZlibOptions;

export interface JsonLinesParseOptions<V> extends ReadLineStreamOptions<V> {
  gzip?: JsonLinesGzipOption;
}

export class JsonLinesParseStream<V = unknown> extends AsyncDuplexBase {
  constructor(options?: JsonLinesParseOptions<V>) {
    const gzip = options?.gzip;

    const readline = new ReadLineStream({
      encoding: options?.encoding,
      lineSep: options?.lineSep ?? "lf",
      parse: options?.parse ?? JSON.parse,
    });

    super(
      {
        writable: gzip
          ? () =>
              import("zlib").then((zlib) => {
                const gunzip = zlib.createGunzip(
                  gzip === true ? undefined : gzip,
                );

                gunzip.pipe(readline);

                return gunzip;
              })
          : readline,
        readable: readline,
      },
      { readableObjectMode: true, writableObjectMode: false },
    );
  }
}

export function parse(
  ...args: ConstructorParameters<typeof JsonLinesParseStream>
): JsonLinesParseStream {
  return new JsonLinesParseStream(...args);
}
