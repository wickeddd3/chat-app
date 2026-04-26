import { AvatarWithBadge } from "@/entities/message";
import { useNavigate } from "react-router";
import { useUsers } from "../model/useUsers";
import { authClient } from "@/shared/lib/better-auth.client";
import { generatePrivateRoomId } from "@/shared/utils/generate-room-id";

export function UserList() {
  const { data: users, isLoading, error } = useUsers();
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const handleMessageUser = (targetUserId: string) => {
    const roomId = generatePrivateRoomId(session?.user?.id || "", targetUserId);
    navigate(`/messages/${roomId}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading users</div>;
  }

  return (
    <div className="flex-1 flex flex-col border-r">
      <div className="border-b p-4">
        <h1 className="text-base font-medium text-foreground">
          People you can message
        </h1>
      </div>
      <div className="flex-1 w-full overflow-y-auto">
        {users?.map(({ id, email, name }: any) => (
          <div
            key={id}
            className="flex items-center gap-4 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <AvatarWithBadge />
            <div className="flex-1 flex flex-col items-start gap-2">
              <span className="text-sm font-medium">{name}</span>
              <span className="text-xs">{email}</span>
            </div>
            <button
              onClick={() => handleMessageUser(id)}
              className="bg-blue-500 text-gray-50 text-sm font-medium rounded-lg p-3 cursor-pointer hover:bg-blue-600"
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
