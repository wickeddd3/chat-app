import { ChatInbox } from "@/features/channel/chat-inbox";
import { CreateGroupChannel } from "@/features/channel/create-group-channel";
import { useParams } from "react-router";
import { AnimatedOutlet } from "@/shared/ui/AnimatedOutlet";
import { fadeVariants } from "@/shared/lib/motion";

export default function MessagesPage() {
  const { channelId } = useParams();
  const isInsideChatRoom = !!channelId;

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden">
      <div
        className={`
          flex-col max-h-full border-r w-full md:w-80 lg:w-96 shrink-0
          ${isInsideChatRoom ? "hidden md:flex" : "flex-1 flex"}
        `}
      >
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-base font-medium text-foreground">Chat Inbox</h1>
          <CreateGroupChannel />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInbox />
        </div>
      </div>
      <div
        className={`flex-1 ${!isInsideChatRoom ? "hidden md:flex" : "flex"}`}
      >
        <AnimatedOutlet
          variants={fadeVariants}
          className="flex flex-1 min-w-0"
        />
      </div>
    </div>
  );
}
