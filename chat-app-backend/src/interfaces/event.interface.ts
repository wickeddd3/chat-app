import type { User } from "better-auth";

export interface Event {
  execute(socket: any, user: User, data: any): void;
}
