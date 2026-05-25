import { UserList } from "@/features/user/user-list";
import { SendConnectionButton } from "@/features/connection/send-connection";
import { Outlet } from "react-router";

export default function UserListPage() {
  return (
    <div className="flex flex-1">
      <UserList sendConnectionButton={SendConnectionButton} />
      <Outlet />
    </div>
  );
}
