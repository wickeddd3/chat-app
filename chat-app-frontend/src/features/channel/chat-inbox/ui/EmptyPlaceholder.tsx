import { MessageCircleOffIcon } from "lucide-react";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4">
      <MessageCircleOffIcon size={60} className="text-gray-300" />
      <p className="text-lg font-medium text-gray-300">Empty</p>
    </div>
  );
}
