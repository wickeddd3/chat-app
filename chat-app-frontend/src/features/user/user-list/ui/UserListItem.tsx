import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import type { User } from "@/entities/user";
import type { ReactNode } from "react";

export function UserListItem({
  user: { id, username, name, image },
  optionSlot,
}: {
  user: User;
  optionSlot?: ReactNode;
}) {
  return (
    <div
      key={id}
      className="flex items-center gap-4 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <ProfileAvatar imageSrc={image || ""} />
      <div className="flex-1 flex flex-col items-start gap-2">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs">{`@${username}`}</span>
      </div>
      {optionSlot}
    </div>
  );
}
