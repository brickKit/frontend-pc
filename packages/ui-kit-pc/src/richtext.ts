// FP20 (UI17): rich text is shown only through this allowlist; scripts, event handlers, styles and frames never pass.
// The backend cleans what it stores as well; this is the display side's own cleaning.
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "code", "pre", "a", "h1", "h2",
  "h3", "h4", "table", "thead", "tbody", "tr", "th", "td"];
const ALLOWED_ATTR = ["href", "title"];

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function sanitize(html: string): string {
  // DOMPurify gives its input back unchanged where it cannot work (no full DOM): shown as text then, never as html
  if (!DOMPurify.isSupported) return escape(html);
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i });
}
