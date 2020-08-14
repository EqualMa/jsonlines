import { Transform, TransformCallback } from "stream";
import { StringDecoder } from "string_decoder";
import { LineSepOption, getLineSepSplitter } from "./util/line-sep";

export type LineParser<V> = (line: string) => V | Promise<V>;

export interface ReadLineStreamOptions<V = string> {
  lineSep?: LineSepOption;
  encoding?: BufferEncoding;
  parse?: LineParser<V>;
}

export class ReadLineStream<V = string> extends Transform {
  /** last line which is not finished yet */
  #unfinishedBuf: string[] = [];
  #decoder: StringDecoder;
  #lineSep: RegExp | string;
  #parser: undefined | LineParser<V>;

  constructor(options?: ReadLineStreamOptions<V>) {
    super({ readableObjectMode: true });

    this.#decoder = new StringDecoder(options?.encoding);
    this.#lineSep = getLineSepSplitter(options?.lineSep ?? "auto");
    this.#parser = options?.parse;
  }

  private async _emitLines(lines: string[]) {
    const p = this.#parser;
    if (lines.length > 0) {
      const values =
        typeof p === "function"
          ? // process with parser
            await Promise.all(lines.map(p))
          : lines;

      for (const v of values) {
        if (v === null) throw new Error("unexpected null when parsing lines");
        else this.push(v);
      }
    }
  }

  private async _writeStrAsync(str: string) {
    const rawLines = str.split(this.#lineSep);
    const len = rawLines.length;

    if (len === 0) return;
    if (len === 1) {
      // str does not contain SEP
      this.#unfinishedBuf.push(rawLines[0]);
      return;
    }

    // [lineEnding, ...lines, unfinishedLine] = rawLines
    const lines: string[] = [
      // previous unfinished line is now finished
      this.#unfinishedBuf.join("") + rawLines[0],
      ...rawLines.slice(1, -1),
    ];

    const unfinishedLine = rawLines[len - 1];
    this.#unfinishedBuf = unfinishedLine.length > 0 ? [unfinishedLine] : [];

    // emit data
    await this._emitLines(lines);
  }

  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const str = this.#decoder.write(chunk);
    this._writeStrAsync(str)
      .then(() => callback())
      .catch((err) => callback(err));
  }

  _flush(callback: TransformCallback): void {
    const str = this.#decoder.end();
    this._writeStrAsync(str)
      .then(() => {
        // process last line before eof
        const line = this.#unfinishedBuf.join("");
        this.#unfinishedBuf = [];

        if (line.length > 0) return this._emitLines([line]);
      })
      .then(() => callback())
      .catch((err) => callback(err));
  }
}
