import { Toaster } from "@/shared/ui/Toaster";
import { AnimatedOutlet } from "@/shared/ui/AnimatedOutlet";

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <AnimatedOutlet className="flex w-full flex-col items-center" />
      <Toaster />
    </div>
  );
}
