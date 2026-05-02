import { RouterProvider } from "react-router";
import { router } from "@/app/router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query.client";
import { TooltipProvider } from "@/shared/ui/shadcn/tooltip";
import { PresenceProvider } from "@/app/store/PresenceContext";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PresenceProvider>
          <RouterProvider router={router} />
        </PresenceProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
