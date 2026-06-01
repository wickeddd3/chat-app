export interface ApiResponse<T = any> {
  success: boolean; // Always true for success, false for errors
  message: string; // A clear summary of the execution outcome
  data?: T; // The main payload (array or object), omitted if empty
  meta?: {
    // Optional pagination metrics block
    limit?: number;
    nextCursor?: string | null;
    hasMore?: boolean;
  };
  timestamp: string; // ISO string useful for client-side caching/debugging
}
