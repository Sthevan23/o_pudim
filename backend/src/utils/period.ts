export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  return [headers.join(";"), ...rows.map((row) => headers.map((h) => escape(row[h])).join(";"))].join("\n");
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function parsePeriod(query: {
  period?: string;
  from?: string;
  to?: string;
}): { from: Date; to: Date } {
  const now = new Date();
  const to = query.to ? endOfDay(new Date(query.to)) : endOfDay(now);
  if (query.from) return { from: startOfDay(new Date(query.from)), to };

  switch (query.period) {
    case "today":
      return { from: startOfDay(now), to };
    case "7d": {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 6);
      return { from, to };
    }
    case "30d": {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 29);
      return { from, to };
    }
    case "this_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to: last };
    }
    default: {
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - 29);
      return { from, to };
    }
  }
}
