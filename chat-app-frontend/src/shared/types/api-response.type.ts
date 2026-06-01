export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
  timestamp: string;
}
