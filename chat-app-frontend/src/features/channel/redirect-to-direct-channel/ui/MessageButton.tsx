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
      className="bg-blue-500 text-gray-50 text-sm font-medium rounded-lg p-3 cursor-pointer hover:bg-blue-600"
    >
      {text}
    </button>
  );
}
