import { useChatNavigation } from "../model/useChatNavigation";

export function MessageButton({
  text,
  targetUserId,
}: {
  text: string;
  targetUserId: string;
}) {
  const { navigateToChannel } = useChatNavigation();

  return (
    <button
      onClick={() => navigateToChannel(targetUserId)}
      className="bg-blue-500 text-gray-50 text-xs font-medium rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-600"
      aria-label="Send message"
      role="button"
      title="Send message"
    >
      {text}
    </button>
  );
}
