import { useEffect } from "react";
import { useMatches } from "react-router";
import { formatDocumentTitle, isRouteMeta } from "@/shared/lib/route-meta";

/**
 * Keeps the document title in step with the route and announces the change.
 *
 * A single-page app swaps content without a page load, so assistive tech gets
 * no signal that navigation happened — the title never changed and focus stays
 * on whatever was clicked. Setting the title covers browser history and tab
 * labels; the live region covers the announcement.
 *
 * Renders nothing visible.
 */
export function RouteAnnouncer() {
  const matches = useMatches();

  // The deepest matched route wins, so a child route can name the page.
  const title = matches
    .filter((match) => isRouteMeta(match.handle))
    .map((match) => (match.handle as { title: string }).title)
    .at(-1);

  useEffect(() => {
    document.title = formatDocumentTitle(title);
  }, [title]);

  // The region is mounted for the life of the layout and only its text changes,
  // which is what assistive tech announces. Rendering the title straight from
  // the route avoids mirroring it into state, which would just re-render twice.
  // The suffix is left off: it is noise when spoken on every navigation.
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {title ?? ""}
    </div>
  );
}
