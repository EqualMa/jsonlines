declare const __NULL_VALUE_UNIQUE_KEY: unique symbol;

// eslint-disable-next-line @typescript-eslint/ban-types
export type NullValue = typeof __NULL_VALUE_UNIQUE_KEY & {};
export const nullValue: NullValue = Object.create(null) as never;

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
