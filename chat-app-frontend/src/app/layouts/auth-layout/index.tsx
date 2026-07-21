import { Toaster } from "@/shared/ui/Toaster";
import { AnimatedOutlet } from "@/shared/ui/AnimatedOutlet";
import { RouteAnnouncer } from "@/shared/ui/RouteAnnouncer";
import { MAIN_CONTENT_ID } from "@/shared/ui/SkipLink";

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <RouteAnnouncer />
      {/* No skip link here: the auth screens have no navigation to bypass. */}
      <main id={MAIN_CONTENT_ID} className="flex w-full flex-col items-center">
        <AnimatedOutlet className="flex w-full flex-col items-center" />
      </main>
      <Toaster />
    </div>
  );
}
