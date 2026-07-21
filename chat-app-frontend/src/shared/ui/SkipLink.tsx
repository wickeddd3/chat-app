export const MAIN_CONTENT_ID = "main-content";

/**
 * WCAG 2.4.1 (Bypass Blocks). The primary navigation precedes the content in
 * the tab order on every screen, so keyboard users need a way past it.
 *
 * Off-screen until focused rather than `sr-only` throughout: a skip link that
 * never becomes visible helps screen reader users but leaves sighted keyboard
 * users with an invisible first stop.
 */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-popover focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-popover-foreground focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-ring"
    >
      Skip to main content
    </a>
  );
}
