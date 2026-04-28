import { Avatar, AvatarBadge, AvatarImage } from "@/shared/ui/shadcn/avatar";

export function AvatarWithBadge({
  imageSrc,
  size = "lg",
}: {
  imageSrc: string;
  size?: "sm" | "default" | "lg" | undefined;
}) {
  return (
    <Avatar size={size}>
      <AvatarImage
        src={imageSrc || "./default-avatar.jpg"}
        alt="avatar-with-badge"
      />
      <AvatarBadge className="bg-green-600 dark:bg-green-800" />
    </Avatar>
  );
}
