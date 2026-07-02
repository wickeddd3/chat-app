import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import type { ReactNode } from "react";

export interface UserListItemProps {
  user: { name: string; username: string; image?: string | null };
  isOnline?: boolean;
  isNew?: boolean;
  date?: string;
  optionSlot?: ReactNode;
}

export function UserListItem({
  user: { name, username, image },
  isOnline,
  isNew = false,
  date,
  optionSlot,
}: UserListItemProps) {
  return (
    <article
      className={`
        flex items-center gap-4 border-b px-4 py-3 text-sm leading-tight last:border-b-0
        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full overflow-hidden
      `}
    >
      <div className="shrink-0">
        <ProfileAvatar
          imageSrc={image || ""}
          isOnline={isOnline}
          badge={isOnline !== undefined}
        />
      </div>

      <div className="flex-1 flex flex-col items-start min-w-0 gap-1">
        <div className="flex items-center gap-2 w-full min-w-0">
          <p className="text-sm font-medium truncate flex-1">{name}</p>
          {isNew && (
            <span
              className={`
              bg-blue-100 text-blue-800 text-[10px] font-medium px-1.5
                py-0.5 rounded-sm shrink-0 whitespace-nowrap
              `}
            >
              New
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 min-w-0 w-full text-muted-foreground">
          <span className="text-xs truncate">{`@${username}`}</span>
          {date && (
            <span className="text-xs shrink-0 whitespace-nowrap">• {date}</span>
          )}
        </div>
      </div>

      {optionSlot && (
        <div className="shrink-0 flex items-center justify-end gap-2">
          {optionSlot}
        </div>
      )}
    </article>
  );
}
