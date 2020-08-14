import { AsyncDuplexBase } from "./util/duplex-base";
import {
  ReadLineStream,
  ReadLineStreamOptions,
  LineParser,
} from "./readline-stream";
import { nullValue } from "./null-value";

export type JsonLinesGzipOption = boolean | import("zlib").ZlibOptions;

export interface JsonLinesParseOptions<V> extends ReadLineStreamOptions<V> {
  gzip?: JsonLinesGzipOption;
}

function wrapParseFunc<V>(parse: LineParser<V>): LineParser<V> {
  return (line) =>
    Promise.resolve(parse(line)).then((s) => {
      if (s === null) return nullValue as never;
      else return s;
    });
}

export class JsonLinesParseStream<V = unknown> extends AsyncDuplexBase {
  constructor(options?: JsonLinesParseOptions<V>) {
    const gzip = options?.gzip;

    const readline = new ReadLineStream({
      encoding: options?.encoding,
      lineSep: options?.lineSep ?? "lf",
      parse: wrapParseFunc(options?.parse ?? JSON.parse),
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
