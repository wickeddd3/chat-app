import { usePresence } from "@/app/store/PresenceContext";
import { AvatarWithBadge } from "@/entities/message";
import type { User } from "@/entities/user";

export function MessageHeader({
  user,
}: {
  user: Partial<User | null | undefined>;
}) {
  const { isOnline } = usePresence();
  const targetUserId = user?.id || "";
  const online = isOnline(targetUserId);

  return (
    <div className="w-full py-5 px-4">
      <div className="flex items-center gap-4">
        <AvatarWithBadge imageSrc={user?.image || ""} isOnline={online} />
        <h1 className="text-md font-medium">{user?.name}</h1>
      </div>
    </div>
  );
}
