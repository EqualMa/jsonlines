# jsonlines

[![npm package @jsonlines/core](https://img.shields.io/npm/v/@jsonlines/core?style=flat-square)](http://npm.im/@jsonlines/core)
[![GitHub package.json dependency version (dev dep on branch)](https://img.shields.io/github/package-json/dependency-version/EqualMa/jsonlines/dev/typescript?style=flat-square)]()
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

a Node.js library to parse, stringify [jsonlines](http://jsonlines.org/) files as streams

## Install

```shell
npm install @jsonlines/core
yarn add @jsonlines/core
```

## Features Guide

<details>
<summary>
Easy to use. parse stream and stringify stream are standard node duplex streams
</summary>

stringify

```js
require("stream")
  .Readable.from([{ v: 1 }, { v: 2 }])
  .pipe(require("@jsonlines/core").stringify())
  .pipe(require("fs").createWriteStream("mydata.jsonl"));
```

parse

```js
require("fs")
  .createReadStream("mydata.jsonl")
  .pipe(require("@jsonlines/core").parse())
  .on("data", (data) => {
    console.log("parsed data: ", data);
  });
```

</details>

<details>
<summary>
Custom stringify / parse functions. Async function or function that returns a Promise is also supported.
</summary>

```js
require("stream")
  .Readable.from([{ v: 1 }, { v: 2 }])
  .pipe(
    require("@jsonlines/core").stringify({
      stringify: myCustomStringifyFunction,
    }),
  )
  .pipe(require("fs").createWriteStream("mydata.jsonl"));
```

```js
require("fs")
  .createReadStream("mydata.jsonl")
  .pipe(
    require("@jsonlines/core").parse({
      parse: myCustomParseFunction,
    }),
  )
  .on("data", (data) => {
    console.log("receive data: ", data);
  });
```

</details>

<details>
<summary>
Gzip / Gunzip
</summary>

stringify to a `.jsonl.gz`

```js
require("stream")
  .Readable.from([{ v: 1 }, { v: 2 }])
  .pipe(
    require("@jsonlines/core").stringify({
      gzip: true,
    }),
  )
  .pipe(require("fs").createWriteStream("mydata.jsonl.gz"));
```

parse from a `.jsonl.gz`

```js
require("fs")
  .createReadStream("mydata.jsonl.gz")
  .pipe(
    require("@jsonlines/core").parse({
      gzip: true,
    }),
  )
  .on("data", (data) => {
    console.log("receive data: ", data);
  });
```

</details>

## Usage

### stringify

```js
const { stringify } = require("@jsonlines/core");
// or import from sub-module
const { stringify } = require("@jsonlines/core/stringify");

// or import with es module
import { stringify } from "@jsonlines/core";
import { stringify } from "@jsonlines/core/stringify";

require("stream")
  .Readable.from([
    // objects
    { v: "object1" },
    { name: "Lady Gaga", records: ["Chromatica"] },
    // arrays
    [1, 2, 3, 4],
    // booleans
    true,
    false,
    // numbers
    2020,
    -1,
    // null
    // Note that single null value can't be written to node streams,
    // so @jsonlines/core provides a helper value to represent null
    require("@jsonlines/core").nullValue,
    require("@jsonlines/core/null-value").nullValue,
    // note that it not necessary to use this helper value when null is in an array or object
    { value: null },
    [null, null],
  ])
  .pipe(
    // create a stringify stream, which is a duplex stream
    stringify(),
  )
  .pipe(process.stdout);
```

the output will be:

```jsonlines
{"v":"object1"}
{"name":"Lady Gaga","records":["Chromatica"]}
[1,2,3,4]
true
false
2020
-1
null
null
{"value":null}
[null,null]
```

#### `stringify` API

```ts
// prettier-ignore
function stringify(options?: JsonLinesStringifyOptions): JsonLinesStringifyStream;
```

`stringify` function accepts an optional object as options and returns an instance of `JsonLinesStringifyStream`.

Note that `JsonLinesStringifyStream` extends `Duplex`.

options:

```ts
export interface JsonLinesStringifyOptions<V> {
  /**
   * specify the encoding to encode string to buffer
   *
   * NOTE that [the standard jsonlines](http://jsonlines.org/)
   * requires `utf8` as file encoding
   *
   * Defaults to `Buffer.from` default encoding,
   * which is `utf8`.
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
  lineSep?: "lf" | "\n" | "crlf" | "\r\n";
}
```

### parse

```js
const { parse } = require("@jsonlines/core");
// or import from sub-module
const { parse } = require("@jsonlines/core/parse");

// or import with es module
import { parse } from "@jsonlines/core";
import { parse } from "@jsonlines/core/parse";

const source = require("stream").Readable.from(`{"v":"object1"}
{"name":"Lady Gaga","records":["Chromatica"]}
[1,2,3,4]
true
false
2020
-1
null
null
{"value":null}
[null,null]
`);

// create a parse stream, which is a duplex stream
const parseStream = parse();

source.pipe(parseStream);

// you can also consume it with for await ... of
parseStream.on("data", (value) => {
  if (value === require("@jsonlines/core/null-value").nullValue)
    console.log(`--- The following value is nullValue ---`);

  console.log(value);
});
```

the output will be:

```
{ v: 'object1' }
{ name: 'Lady Gaga', records: [ 'Chromatica' ] }
[ 1, 2, 3, 4 ]
true
false
2020
-1
--- The following value is nullValue ---
[Object: null prototype] [Null] {}
--- The following value is nullValue ---
[Object: null prototype] [Null] {}
{ value: null }
[ null, null ]
```

#### `parse` API

```ts
function parse(options?: JsonLinesParseOptions<V>): JsonLinesParseStream;
```

`parse` function accepts an optional object as options
and returns an instance of `JsonLinesParseStream`.

Note that `JsonLinesParseStream` extends `Duplex`.

options:

```ts
export interface JsonLinesParseOptions<V> {
  /**
   * specify the encoding to decode buffer to string
   *
   * NOTE that [the standard jsonlines](http://jsonlines.org/)
   * requires `utf8` as file encoding
   *
   * Defaults to `utf8`
   */
  encoding?: BufferEncoding;

  /**
   * specify a function to parse json line.
   * It accepts a string as parameter,
   * and should return a value or a Promise<V>.
   *
   * Defaults to `JSON.parse`
   */
  parse?: (line: string) => V | Promise<V>;

  /**
   * specify whether to gunzip the source
   *
   * Omit or use `false` to disable gunzip.
   * Use `true` to gunzip with default options.
   * Or use an object as params for `require('zlib').createGunzip`
   */
  gzip?: JsonLinesGzipOption;

  /**
   * specify the line ending to be parsed
   *
   * NOTE that [the standard jsonlines](http://jsonlines.org/)
   * requires `\n` as line separator
   *
   * If set to `auto`, both `\n` and `\r\n` will be accepted
   *
   * Defaults to `\n`
   */
  lineSep?: "lf" | "\n" | "crlf" | "\r\n" | "auto";
}
```
