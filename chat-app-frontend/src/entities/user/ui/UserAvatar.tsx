import { Avatar, AvatarImage } from "@/shared/ui/shadcn/avatar";

export function UserAvatar({
  imageSrc,
  size = "sm",
}: {
  imageSrc: string;
  size?: "sm" | "default" | "lg" | undefined;
}) {
  return (
    <Avatar size={size}>
      <AvatarImage
        src={imageSrc || "./default-avatar.jpg"}
        alt="author-avatar"
      />
    </Avatar>
  );
}
