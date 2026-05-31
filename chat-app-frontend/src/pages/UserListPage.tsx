import { Outlet } from "react-router";
import { UserList } from "@/features/user/user-list";
import { MessageButton } from "@/features/channel/redirect-to-direct-channel";
import { SendButton } from "@/features/connection/send-connection";
import { CancelButton } from "@/features/connection/cancel-connection";
import { DeclineButton } from "@/features/connection/decline-connection";
import { AcceptButton } from "@/features/connection/accept-connection";

export default function UserListPage() {
  return (
    <div className="flex flex-1">
      <UserList
        messageButton={MessageButton}
        sendButton={SendButton}
        cancelButton={CancelButton}
        declineButton={DeclineButton}
        acceptButton={AcceptButton}
      />
      <Outlet />
    </div>
  );
}
