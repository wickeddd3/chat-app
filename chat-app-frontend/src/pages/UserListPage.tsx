import { UserList } from "@/features/user/user-list";
import { SendButton } from "@/features/connection/send-connection";
import { Outlet } from "react-router";

export default function UserListPage() {
  return (
    <div className="flex flex-1">
      <UserList sendButton={SendButton} />
      <Outlet />
    </div>
  );
}
