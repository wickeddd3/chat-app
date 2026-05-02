import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarBadge, AvatarImage } from "@/shared/ui/shadcn/avatar";

export function AvatarWithBadge({
  imageSrc,
  size = "lg",
  isOnline = false,
}: {
  imageSrc: string;
  size?: "sm" | "default" | "lg" | undefined;
  isOnline?: boolean;
}) {
  return (
    <Avatar size={size}>
      <AvatarImage
        src={imageSrc || "/default-avatar.jpg"}
        alt="avatar-with-badge"
      />
      <AvatarBadge
        className={cn(
          "bg-gray-400 dark:bg-gray-300",
          `${isOnline && "bg-green-600 dark:bg-green-800"}`,
        )}
      />
    </Avatar>
  );
}
