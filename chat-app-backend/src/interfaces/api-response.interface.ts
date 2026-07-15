export interface ApiResponse<T = unknown> {
  success: boolean; // Always true for success, false for errors
  message: string; // A clear summary of the execution outcome
  data?: T; // The main payload (array or object), omitted if empty
  meta?: {
    // Optional pagination metrics block
    limit: number;
    nextCursor: string | number | null;
    hasMore: boolean;
    total?: number; // Total items matching the query, across all pages
  };
  timestamp: string; // ISO string useful for client-side caching/debugging
}
