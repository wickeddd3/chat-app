import { Avatar, AvatarImage } from "@/shared/ui/shadcn/avatar";

export function AuthorAvatar() {
  return (
    <Avatar size="sm">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
    </Avatar>
  );
}
