export function flatQuery(value: string | (string | null)[]): string[] {
  if (typeof value === "string") {
    return [value];
  } else if (Array.isArray(value)) {
    return value.filter(v => v !== null).map(v => v as string);
  } else {
    return [];
  }
}

export const delay = (timeout: number): Promise<void> => new Promise(res => setTimeout(res, timeout));
