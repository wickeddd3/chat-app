import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query.client";
import { TooltipProvider } from "@/shared/ui/shadcn/tooltip";
import { AuthProvider, PresenceProvider } from "@/entities/auth";

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
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
