import { Toaster } from "@/shared/ui/shadcn/sonner";
import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <Outlet />
      <Toaster theme="light" />
    </div>
  );
}
