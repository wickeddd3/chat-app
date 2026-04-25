import { AuthorAvatar } from "@/entities/message";

export function MessageBubble({
  content,
  authId,
}: {
  content: any;
  authId: string;
}) {
  const {
    text,
    time,
    author: { id: authorId, name: authorName },
  } = content;

  const isMessageAuthoredByCurrentUser = authorId === authId;

  return (
    <div
      className={`flex justify-start gap-2  ${isMessageAuthoredByCurrentUser ? "flex-row-reverse ml-12" : "mr-12"}`}
    >
      <AuthorAvatar />
      <div
        className={`flex flex-col gap-2 p-3 ${isMessageAuthoredByCurrentUser ? "bg-blue-500 text-white rounded-l-lg rounded-br-lg" : "bg-gray-200 rounded-r-lg rounded-bl-lg"}`}
      >
        <div className="flex items-center gap-4">
          <p className="text-xs font-semibold opacity-75">{authorName}</p>
          <span className="text-xs opacity-50">{time}</span>
        </div>
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}
