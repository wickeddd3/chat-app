import type { ConnectionUser } from "../model/connection.types";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";

export function MemberListItem({
  user,
  onToggleMember,
  selectedIds,
}: {
  user: ConnectionUser;
  onToggleMember: (value: string) => void;
  selectedIds: string[];
}) {
  return (
    <label
      key={user.id}
      className="w-full flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-50"
    >
      <div className="flex-1 flex items-center gap-4">
        <ProfileAvatar imageSrc={user.image || ""} size="lg" />
        <div className="flex-1 flex flex-col items-start gap-1">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs">{`@${user.username}`}</span>
        </div>
      </div>
      <input
        type="checkbox"
        // Use checked for controlled component
        checked={selectedIds.includes(user.id)}
        // Use onChange to keep the form state in sync; wrapping <label> names the
        // checkbox by the row's text and makes the whole row keyboard-operable
        onChange={() => onToggleMember(user.id)}
        className="h-4 w-4 cursor-pointer accent-blue-500"
      />
    </label>
  );
}
