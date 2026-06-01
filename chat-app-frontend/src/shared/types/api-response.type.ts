export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  meta?: {
    limit?: number;
    nextCursor?: string | null;
    hasMore?: boolean;
  };
  timestamp: string;
}
