// FP17 (protocol 20's languages and formats): amounts are the backend's decimal strings, formatted, never computed
// in floating point; the decimals are the currency's (ISO 4217, from the runtime's Intl); a business date shows as it
// is; an instant shows in the legal entity's time zone with the zone named; data's multilingual text falls back along
// the user's language, its primary subtag, then the default name.

/** The ISO 4217 minor units of a currency (JPY 0, CNY 2, KWD 3). */
export function decimalsOf(currency: string): number {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

const decimal = /^-?\d+(\.\d+)?$/;

/** An amount: the decimal string as the backend gave it, with the currency's decimals, in the user's locale. */
export function money(amount: string, currency: string, locale: string): string {
  if (!decimal.test(amount)) throw new Error(`not a decimal amount: ${amount}`);
  const digits = decimalsOf(currency);
  // Intl formats a decimal string exactly (no float); the type wants a number, the runtime takes the string
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits,
    maximumFractionDigits: digits }).format(amount as unknown as number);
}

/** A business date (YYYY-MM-DD) is a date, not an instant: shown as it is, never moved by a time zone. */
export function businessDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`not a business date: ${date}`);
  return date;
}

/** An instant in the legal entity's time zone, the zone named. */
export function instant(iso: string, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit",
    minute: "2-digit", timeZoneName: "short", hourCycle: "h23" }).format(new Date(iso));
}

export interface TextSet {
  default: string;
  translations?: Record<string, string>; // BCP 47 tag -> text
}

/** Multilingual data text: the user's language, its primary subtag, else the default name. */
export function localized(t: TextSet, language: string): string {
  const tr = t.translations ?? {};
  return tr[language] ?? tr[language.split("-")[0]!] ?? t.default;
}
