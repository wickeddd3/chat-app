import { ChatCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/shared/ui/shadcn/button";
import { useChatNavigation } from "../model/useChatNavigation";

export interface MessageButtonProps {
  text: string;
  targetUserId: string;
}

export function MessageButton({ text, targetUserId }: MessageButtonProps) {
  const { navigateToChannel } = useChatNavigation();

  return (
    <Button
      onClick={() => navigateToChannel(targetUserId)}
      variant="default"
      size="sm"
      className="cursor-pointer gap-2"
      aria-label="Send message"
      title="Send message"
    >
      <ChatCircleIcon className="size-4" />
      <span className="hidden sm:inline-block">{text}</span>
    </Button>
  );
}
