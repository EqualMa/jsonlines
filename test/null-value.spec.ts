import { nullValue } from "../src/null-value";

test("Object.prototype.toString", () => {
  expect(Object.prototype.toString.call(nullValue)).toBe(
    Object.prototype.toString.call(null),
  );
});

test("Number calculation", () => {
  const nvAsNum = (nullValue as unknown) as number;
  const nullAsNum = (null as unknown) as number;

  expect(1 + nvAsNum).toBe(1 + nullAsNum);
  expect(1 - nvAsNum).toBe(1 - nullAsNum);
  expect(1 * nvAsNum).toBe(1 * nullAsNum);
  expect(1 / nvAsNum).toBe(1 / nullAsNum);

  expect(0 * nvAsNum).toBe(0 * nullAsNum);
  expect(0 / nvAsNum).toBe(0 / nullAsNum);
});

test("Number parsing", () => {
  const nvAsStr = (nullValue as unknown) as string;
  const nullAsStr = (null as unknown) as string;
  expect(Number.parseInt(nvAsStr)).toBe(Number.parseInt(nullAsStr));
  expect(Number.parseFloat(nvAsStr)).toBe(Number.parseFloat(nullAsStr));
});

test("JSON.stringify", () => {
  expect(JSON.stringify(nullValue)).toBe(JSON.stringify(null));
});
