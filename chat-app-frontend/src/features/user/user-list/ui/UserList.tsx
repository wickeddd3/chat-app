import { SearchField } from "@/shared/ui/SearchField";
import { useUsers } from "../model/useUsers";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { UserListItem } from "./UserListItem";
import { useState } from "react";

export function UserList() {
  const { users, isLoading, isEmpty } = useUsers();
  const [query, setQuery] = useState("");

  return (
    <div className="flex-1 flex flex-col border-r">
      <div className="p-4">
        <h1 className="text-base font-medium text-foreground">
          People you can message
        </h1>
      </div>
      <SearchField
        value={query}
        onChange={setQuery}
        className="px-4 pb-6 pt-1"
      />
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
