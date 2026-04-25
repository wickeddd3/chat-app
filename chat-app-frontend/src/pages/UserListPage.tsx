import { UserList } from "@/features/user/user-list";
import { Outlet } from "react-router";

export default function UserListPage() {
  return (
    <div className="flex flex-1">
      <UserList />
      <Outlet />
    </div>
  );
}
