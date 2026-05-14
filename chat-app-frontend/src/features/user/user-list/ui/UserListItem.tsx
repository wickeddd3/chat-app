import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { useChatNavigation } from "../model/useChatNavigation";
import type { User } from "@/entities/user";

export function UserListItem({
  user: { id, username, name, image },
}: {
  user: User;
}) {
  const { navigateToChannel } = useChatNavigation();

  return (
    <div
      key={id}
      className="flex items-center gap-4 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <ProfileAvatar imageSrc={image || ""} />
      <div className="flex-1 flex flex-col items-start gap-2">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs">{`@${username}`}</span>
      </div>
      <button
        onClick={() => navigateToChannel(id)}
        className="bg-blue-500 text-gray-50 text-sm font-medium rounded-lg p-3 cursor-pointer hover:bg-blue-600"
      >
        Message
      </button>
    </div>
  );
}
