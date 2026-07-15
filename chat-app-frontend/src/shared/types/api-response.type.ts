export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
  };
  timestamp: string;
}
