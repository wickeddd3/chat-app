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
    <article
      key={id}
      className={`
        flex items-center gap-4 border-b px-4 py-3 text-sm leading-tight last:border-b-0 
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full overflow-hidden
      `}
    >
      <div className="shrink-0">
        <ProfileAvatar imageSrc={image || ""} />
      </div>

      <div className="flex-1 flex flex-col items-start min-w-0 gap-1">
        <span className="text-sm font-medium truncate w-full">{name}</span>
        <span className="text-xs text-muted-foreground truncate w-full">{`@${username}`}</span>
      </div>

      {optionSlot && (
        <div className="shrink-0 flex items-center justify-end">
          {optionSlot}
        </div>
      )}
    </article>
  );
}
