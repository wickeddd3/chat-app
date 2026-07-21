export interface MessageTextToken {
  type: "text";
  value: string;
}

export interface MessageLinkToken {
  type: "link";
  /** The text as the author typed it. */
  value: string;
  /** The resolved, scheme-checked destination. */
  href: string;
}

export type MessageToken = MessageTextToken | MessageLinkToken;

/**
 * Either an explicit http(s) URL or a bare `www.` host. Deliberately narrow:
 * anything without one of those two openings stays plain text, which keeps
 * schemes like `javascript:` from ever reaching an anchor.
 */
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+/gi;

/** Sentence punctuation that trails a URL far more often than it belongs to one. */
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;

const countOf = (text: string, character: string) =>
  text.split(character).length - 1;

/**
 * Trims what a writer appended rather than typed: "see https://a.dev." keeps
 * the sentence's full stop out of the link, and a URL quoted inside parentheses
 * doesn't swallow the closing one — while a balanced pair, as in Wikipedia
 * URLs, survives.
 */
function trimTrailing(raw: string): string {
  let trimmed = raw.replace(TRAILING_PUNCTUATION, "");

  while (
    trimmed.endsWith(")") &&
    countOf(trimmed, ")") > countOf(trimmed, "(")
  ) {
    trimmed = trimmed.slice(0, -1).replace(TRAILING_PUNCTUATION, "");
  }

  return trimmed;
}

/**
 * Resolves the matched text to a destination, or null when it isn't one we're
 * willing to render as a link.
 */
function toHref(raw: string): string | null {
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/**
 * Splits message content into plain runs and linkable ones.
 *
 * Every character of the input lands in exactly one token, in order, so the
 * rendered result is character-identical to the raw text — which matters when
 * the bubble preserves whitespace.
 */
export function tokenizeMessageLinks(content: string): MessageToken[] {
  const tokens: MessageToken[] = [];
  let cursor = 0;

  for (const match of content.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    const value = trimTrailing(match[0]);
    const href = toHref(value);

    // Unresolvable: leave the cursor be, so the text is swept into the next
    // plain run rather than dropped.
    if (!href || !value) continue;

    if (start > cursor) {
      tokens.push({ type: "text", value: content.slice(cursor, start) });
    }

    tokens.push({ type: "link", value, href });
    cursor = start + value.length;
  }

  if (cursor < content.length) {
    tokens.push({ type: "text", value: content.slice(cursor) });
  }

  return tokens;
}
