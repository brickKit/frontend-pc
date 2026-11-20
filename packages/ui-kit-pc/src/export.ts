// FP20 (protocol 20's browser safety, UI18): a cell exported to a spreadsheet that starts with =, +, -, @, a tab or a
// carriage return would run as a formula; it gets a leading apostrophe. Every export goes through here.
const formula = /^[=+\-@\t\r]/;

export function safeCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return formula.test(s) ? `'${s}` : s;
}

/** CSV with every cell made safe and quoted as RFC 4180 wants. */
export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map((v) => `"${safeCell(v).replace(/"/g, '""')}"`).join(",")).join("\r\n") + "\r\n";
}
