import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import type { ReactNode } from "react";

export function ConnectionItem({
  user: { name, image, username },
  date,
  optionSlot,
}: {
  user: { name: string; username: string; image?: string | null };
  date?: string;
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
        <ProfileAvatar imageSrc={image || ""} />
      </div>

      <div className="flex-1 flex flex-col items-start min-w-0 gap-1">
        <h1 className="text-sm font-medium truncate w-full">{name}</h1>
        <div className="flex items-center gap-1 min-w-0 w-full text-muted-foreground">
          <h2 className="text-xs truncate">{`@${username}`}</h2>
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
