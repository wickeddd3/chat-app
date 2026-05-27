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
    <article className="flex items-center gap-4 border-b px-4 py-3 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
      <ProfileAvatar imageSrc={image || ""} />
      <div className="flex-1 flex flex-col items-start gap-2">
        <h1 className="text-sm font-medium">{name}</h1>
        <div className="flex items-center gap-1">
          <h2 className="text-xs">{`@${username}`}</h2>
          {date && (
            <span className="text-xs text-muted-foreground">• {date}</span>
          )}
        </div>
      </div>
      {optionSlot}
    </article>
  );
}
