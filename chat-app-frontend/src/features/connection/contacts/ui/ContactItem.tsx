import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import type { ReactNode } from "react";

export function ContactItem({
  user: { name, image, username },
  isNew = false,
  optionSlot,
}: {
  user: { name: string; username: string; image?: string | null };
  isNew?: boolean;
  optionSlot?: ReactNode;
}) {
  return (
    <article className="flex items-center gap-4 border-b px-4 py-3 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
      <ProfileAvatar imageSrc={image || ""} />
      <div className="flex-1 flex flex-col items-start gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium">{name}</h1>
          {isNew && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-sm">
              New
            </span>
          )}
        </div>

        <h2 className="text-xs">{`@${username}`}</h2>
      </div>
      {optionSlot}
    </article>
  );
}
