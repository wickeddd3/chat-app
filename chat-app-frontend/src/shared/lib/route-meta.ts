export const APP_NAME = "Chikamo";

/** Attached to a route as `handle` so the title lives beside the route. */
export interface RouteMeta {
  title: string;
}

export function isRouteMeta(handle: unknown): handle is RouteMeta {
  return (
    typeof handle === "object" &&
    handle !== null &&
    typeof (handle as RouteMeta).title === "string"
  );
}

/** "Messages · Chikamo" — the page first, so it survives tab truncation. */
export function formatDocumentTitle(title?: string): string {
  return title ? `${title} · ${APP_NAME}` : APP_NAME;
}
