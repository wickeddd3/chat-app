import { RouterProvider } from "react-router";
import { router } from "@/app/router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query.client";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
