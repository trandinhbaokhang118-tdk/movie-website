export type ObjectRange =
  | { offset: number; length?: number }
  | { offset?: number; length: number }
  | { suffix: number };

export function resolveObjectRange(range: ObjectRange, objectSize: number) {
  if ("suffix" in range) {
    const length = Math.min(Math.max(0, range.suffix), objectSize);
    return { offset: objectSize - length, length };
  }
  const offset = Math.min(Math.max(0, range.offset ?? 0), objectSize);
  const length = Math.min(Math.max(0, range.length ?? objectSize - offset), objectSize - offset);
  return { offset, length };
}
