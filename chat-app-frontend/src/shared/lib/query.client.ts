import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays "fresh" for 5 minutes
      gcTime: 1000 * 60 * 10, // Unused data is removed after 10 mins (formerly cacheTime)
      retry: 2, // Retry failed requests twice before showing error
      refetchOnWindowFocus: false, // Don't refetch when user clicks back into the tab
    },
    mutations: {
      retry: 1, // Custom retry logic for updates/deletes
    },
  },
});
