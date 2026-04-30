import { useUsers } from "../model/useUsers";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { UserListItem } from "./UserListItem";

export function UserList() {
  const { users, isLoading, isEmpty } = useUsers();

  return (
    <div className="flex-1 flex flex-col border-r">
      <div className="border-b p-4">
        <h1 className="text-base font-medium text-foreground">
          People you can message
        </h1>
      </div>
      <div className="flex-1 w-full overflow-y-auto">
        {isLoading && <LoadingPlaceholder />}

        {users?.map((user) => (
          <UserListItem key={user.id} user={user} />
        ))}

        {isEmpty && <EmptyPlaceholder />}
      </div>
    </div>
  );
}
