import { ReadLineStream } from "../src";
import { pipeline as _pl, Readable } from "stream";
import { promisify } from "util";
import { asyncIterableToArray } from "../src/util/stream-to";
const pipeline = promisify(_pl);

test("read lines", async () => {
  const source = Readable.from([
    //
    "1: data\n",
    "2: ",
    "data\n",
    "3: data",
    "\n",
  ]);
  const duplex = new ReadLineStream();

  const done = pipeline([source, duplex]);

  const lines = await asyncIterableToArray(duplex);

  expect(lines).toStrictEqual([1, 2, 3].map((i) => `${i}: data`));

  await done;
});

test("last line separator is optional", async () => {
  const source = Readable.from([
    //
    "1: data\n",
    "2: ",
    "data\n",
    "3: data",
  ]);
  const duplex = new ReadLineStream();

  const done = pipeline([source, duplex]);

  const lines = await asyncIterableToArray(duplex);

  expect(lines).toStrictEqual([1, 2, 3].map((i) => `${i}: data`));

  await done;
});

test("parse line", async () => {
  const source = Readable.from([
    //
    "1: data\n",
    "2: data\n",
    "3: data\n",
  ]);
  const duplex = new ReadLineStream({
    parse: (line) => parseInt(line.slice(0, 1), 10),
  });

  const done = pipeline([source, duplex]);

  const vals = await asyncIterableToArray(duplex);

  expect(vals).toStrictEqual([1, 2, 3]);

  await done;
});

test("multiple empty lines", async () => {
  const source = Readable.from([
    //
    "\n",
    "\n",
    "\n",
  ]);
  const duplex = new ReadLineStream();

  const done = pipeline([source, duplex]);

  const vals = await asyncIterableToArray(duplex);

  expect(vals).toStrictEqual(["", "", ""]);

  await done;
});

test("trailing empty chunk", async () => {
  const source = Readable.from([
    //
    "1\n",
    "2\n",
    "3\n",
    "",
  ]);
  const duplex = new ReadLineStream();

  const done = pipeline([source, duplex]);

  const vals = await asyncIterableToArray(duplex);

  expect(vals).toStrictEqual(["1", "2", "3"]);

  await done;
});
