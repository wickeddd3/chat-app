import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query.client";
import { TooltipProvider } from "@/shared/ui/shadcn/tooltip";
import { AuthProvider, PresenceProvider } from "@/entities/auth";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <PresenceProvider>{children}</PresenceProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
