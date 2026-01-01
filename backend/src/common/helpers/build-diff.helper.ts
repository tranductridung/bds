export function buildDiff<T extends object>(before: T, patch: Partial<T>) {
  const oldValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};

  for (const key of Object.keys(patch) as (keyof T)[]) {
    const prev = before[key];
    const next = patch[key];

    if (next !== undefined && prev !== next) {
      oldValue[key as string] = prev as unknown;
      newValue[key as string] = next as unknown;
    }
  }

  return {
    oldValue: Object.keys(oldValue).length ? oldValue : undefined,
    newValue: Object.keys(newValue).length ? newValue : undefined,
  };
}
