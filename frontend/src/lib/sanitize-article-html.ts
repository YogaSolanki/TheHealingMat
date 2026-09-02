function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitize admin-authored article HTML for safe public rendering.
 * Allows basic formatting only: bold, italic, underline, lists, links, headings.
 */
export function sanitizeArticleHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  const input = raw.trim();
  if (!input) return "";

  // Plain text from older articles — preserve line breaks
  if (!/<[a-z][\s\S]*>/i.test(input)) {
    return escapeHtml(input).replace(/\r\n|\n|\r/g, "<br />");
  }

  let html = input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(
      /<\/?(iframe|object|embed|form|input|button|link|meta|svg|math)[^>]*>/gi,
      "",
    )
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  // Normalize links
  html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_m, attrs: string, text: string) => {
    const hrefMatch = attrs.match(
      /\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i,
    );
    const href = (hrefMatch?.[2] || hrefMatch?.[3] || hrefMatch?.[4] || "").trim();
    if (!/^https?:\/\//i.test(href)) {
      return text;
    }
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  // Keep only basic formatting tags; unwrap anything else
  html = html.replace(
    /<\/?(?!\/?(?:p|br|strong|b|em|i|u|ul|ol|li|a|h2|h3|blockquote)\b)[a-z][a-z0-9]*\b[^>]*>/gi,
    "",
  );

  // Strip attributes from non-link tags
  html = html.replace(
    /<(p|br|strong|b|em|i|u|ul|ol|li|h2|h3|blockquote)(\s[^>]*)?\/?>/gi,
    (_m, tag: string) => (tag.toLowerCase() === "br" ? "<br />" : `<${tag.toLowerCase()}>`),
  );

  return html;
}
