import { RouterProvider } from "react-router";
import { router } from "@/app/router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query.client";
import { TooltipProvider } from "@/shared/ui/shadcn/tooltip";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
