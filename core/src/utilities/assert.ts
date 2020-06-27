export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be defined, but received ${val}`);
  }
}

export function assertIsNumber<T>(val: unknown, key: keyof T): asserts val is number {
  if (typeof val !== "number") {
    throw new Error(`Expected '${key}' to be number, but received ${val}`);
  }
}

export function assertIsString<T>(val: unknown, key: keyof T): asserts val is string {
  if (typeof val !== "string") {
    throw new Error(`Expected '${key}' to be string, but received ${val}`);
  }
}

export function assertRegex<T>(val: unknown, key: keyof T, regex: RegExp): asserts val is string {
  assertIsString<T>(val, key);
  if (!regex.test(val)) {
    throw new Error(`Expected '${key}' to be string, but received ${val}`);
  }
}

export function assertIsBoolean<T>(val: unknown, key: keyof T): asserts val is boolean {
  if (typeof val !== "boolean") {
    throw new Error(`Expected '${key}' to be string, but received ${val}`);
  }
}

export function assertIsArray<T>(val: unknown, key: keyof T): asserts val is any[] {
  if (!Array.isArray(val)) {
    throw new Error(`Expected '${key}' to be array, but received ${val}`);
  }
}

export function assertIncludes<T>(val: unknown, key: keyof T, list: readonly unknown[]) {
  if (!list.includes(val)) {
    throw new Error(`Expected '${key}' to be array, but received ${val}`);
  }
}
