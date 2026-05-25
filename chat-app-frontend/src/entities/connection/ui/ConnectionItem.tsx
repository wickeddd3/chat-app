import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import type { ReactNode } from "react";

export function ConnectionItem({
  user: { name, image },
  optionSlot,
}: {
  user: { name: string; image?: string | null };
  optionSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
      <ProfileAvatar imageSrc={image || ""} />
      <div className="flex-1 flex flex-col items-start gap-2">
        <span className="text-sm font-medium">{name}</span>
      </div>
      {optionSlot}
    </div>
  );
}
