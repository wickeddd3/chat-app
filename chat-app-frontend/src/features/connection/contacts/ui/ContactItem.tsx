import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import type { ReactNode } from "react";

export function ContactItem({
  user: { name, image, username },
  isNew = false,
  isOnline = false,
  optionSlot,
}: {
  user: { name: string; username: string; image?: string | null };
  isNew?: boolean;
  isOnline?: boolean;
  optionSlot?: ReactNode;
}) {
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
          badge={true}
        />
      </div>

      <div className="flex-1 flex flex-col items-start min-w-0 gap-1">
        <div className="flex items-center gap-2 w-full min-w-0">
          <h1 className="text-sm font-medium truncate flex-1">{name}</h1>
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

        <h2 className="text-xs text-muted-foreground truncate w-full">{`@${username}`}</h2>
      </div>

      {optionSlot && (
        <div className="shrink-0 flex items-center justify-end">
          {optionSlot}
        </div>
      )}
    </article>
  );
}
