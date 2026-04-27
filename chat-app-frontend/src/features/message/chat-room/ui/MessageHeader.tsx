import { AvatarWithBadge } from "@/entities/message";
import type { User } from "@/entities/user";

export function MessageHeader({
  user,
}: {
  user: Partial<User | null | undefined>;
}) {
  return (
    <div className="w-full py-5 px-4">
      <div className="flex items-center gap-4">
        <AvatarWithBadge />
        <h1 className="text-md font-medium">{user?.name}</h1>
      </div>
    </div>
  );
}
