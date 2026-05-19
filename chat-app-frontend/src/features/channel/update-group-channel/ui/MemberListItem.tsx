import type { User } from "@/entities/user";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";

export function MemberListItem({
  user,
  onToggleMember,
  selectedIds,
}: {
  user: User;
  onToggleMember: (value: string) => void;
  selectedIds: string[];
}) {
  return (
    <div
      key={user.id}
      className="w-full flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-50"
      onClick={() => onToggleMember(user.id)}
    >
      <div className="flex-1 flex items-center gap-4">
        <ProfileAvatar imageSrc={user.image || ""} size="lg" />
        <div className="flex flex-col">
          <h6 className="font-medium text-sm">{user.name}</h6>
        </div>
      </div>
      <input
        type="checkbox"
        // Use checked for controlled component
        checked={selectedIds.includes(user.id)}
        // Stop propagation so clicking the checkbox doesn't trigger the div's onClick
        onClick={(e) => e.stopPropagation()}
        // Use onChange to keep the form state in sync
        onChange={() => onToggleMember(user.id)}
        className="h-4 w-4 cursor-pointer accent-blue-500"
      />
    </div>
  );
}
