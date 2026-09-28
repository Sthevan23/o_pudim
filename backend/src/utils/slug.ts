export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function serializeDecimal<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber() as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeDecimal(item)) as T;
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = serializeDecimal(nested);
    }
    return output as T;
  }
  return value;
}
