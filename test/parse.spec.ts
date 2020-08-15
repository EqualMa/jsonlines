import { parse } from "../src";
import { pipeline as _pl, Readable } from "stream";
import { promisify } from "util";
import { asyncIterableToArray } from "../src/util/stream-to";
const pipeline = promisify(_pl);

test("parse gzipped", async () => {
  const buf = Buffer.from(
    "H4sIAAAAAAAAA6tWKlOyMqzlqgbThkgsVDaIBwCrHftqLAAAAA==",
    "base64",
  );

  const source = Readable.from([buf]);
  const parseStream = parse({ gzip: true });

  const done = pipeline(source, parseStream);

  const vals = await asyncIterableToArray(parseStream);

  expect(vals).toStrictEqual([
    { v: 1 },
    { v: 111 },
    { v: 11111 },
    { v: 1111111 },
  ]);

  await done;
});
