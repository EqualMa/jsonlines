// eslint-disable-next-line @typescript-eslint/ban-types
export const nullValue: object = Object.create(null) as object;

Reflect.defineProperty(nullValue, Symbol.toStringTag, {
  value: Object.prototype.toString
    .call(null)
    .slice("[object ".length, -"]".length),
});

Reflect.defineProperty(nullValue, Symbol.toPrimitive, {
  value: () => null,
});

Reflect.defineProperty(nullValue, "toJSON", {
  value: () => null,
});

Reflect.defineProperty(nullValue, "toString", {
  value: () => "null",
});
