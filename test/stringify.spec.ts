import { stringify } from "../src";
import { pipeline as _pl, Readable } from "stream";
import { promisify } from "util";
import { streamToString } from "../src/util/stream-to";
const pipeline = promisify(_pl);

test("stringify objects to jsonlines", async () => {
  const values = [
    //
    {},
    { v: 1 },
    { str: "Hello World!\nHi!" },
    { a: 0, b: null },
    [1, 2, 3],
    true,
    "I love @jsonlines/core",
    123,
  ];

  const source = Readable.from(values);
  const duplex = stringify();

  const done = pipeline([source, duplex]);

  const jsonlinesText = await streamToString(duplex, "utf8");

  expect(jsonlinesText).toBe(
    values.map((v) => JSON.stringify(v)).join("\n") + "\n",
  );

  await done;
});
