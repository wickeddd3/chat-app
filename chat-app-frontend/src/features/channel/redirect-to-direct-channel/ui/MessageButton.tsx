import { ChatCircleIcon } from "@phosphor-icons/react";
import { useChatNavigation } from "../model/useChatNavigation";

export interface MessageButtonProps {
  text: string;
  targetUserId: string;
}

export function MessageButton({ text, targetUserId }: MessageButtonProps) {
  const { navigateToChannel } = useChatNavigation();

  return (
    <button
      onClick={() => navigateToChannel(targetUserId)}
      className="bg-primary  rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90"
      aria-label="Send message"
      role="button"
      title="Send message"
    >
      <ChatCircleIcon className="size-4 text-gray-50" />
      <span className="text-xs font-medium text-gray-50 hidden sm:inline-block">
        {text}
      </span>
    </button>
  );
}
