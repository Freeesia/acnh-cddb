export function flatQuery(value: string | (string | null)[]): string[] {
  if (typeof value === "string") {
    return [value];
  } else if (Array.isArray(value)) {
    return value.filter(v => v !== null).map(v => v as string);
  } else {
    return [];
  }
}
