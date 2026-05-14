export interface User {
  id: string;
  name: string;
  username: string;
  image?: string;
}

export interface PaginatedUsers {
  users: User[];
  hasMore: boolean;
  nextCursor: string;
}
