/**
 * Minimal RFC-4180 compliant CSV parser.
 * Handles quoted fields, embedded commas, and escaped quotes.
 * Used in CSV import UIs across the application.
 */
export function parseCsvSimple(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const rawHeaders = parseRow(lines[0] || '');
  const headers = rawHeaders.map((h) => h.replace(/^[\"']|[\"']$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i] || '');
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (vals[idx] || '').replace(/^[\"']|[\"']$/g, '');
    });
    rows.push(obj);
  }

  return { headers, rows };
}
