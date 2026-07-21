import { Link } from "react-router";
import { Button } from "@/shared/ui/shadcn/button";
import { RouteAnnouncer } from "@/shared/ui/RouteAnnouncer";
import { MAIN_CONTENT_ID } from "@/shared/ui/SkipLink";

/**
 * The catch-all sits outside both layouts, so it mounts its own announcer —
 * otherwise the tab title would stay on whatever page preceded it.
 */
export default function NotFoundPage() {
  return (
    <>
      <RouteAnnouncer />
      <main
        id={MAIN_CONTENT_ID}
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground"
      >
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you were looking for does not exist or has moved.
        </p>
        <Button asChild className="mt-2">
          <Link to="/messages">Back to messages</Link>
        </Button>
      </main>
    </>
  );
}
