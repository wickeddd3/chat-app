import { FaArrowPointer } from "react-icons/fa6";

export function ContentPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4">
      <FaArrowPointer size={60} className="text-gray-300" />
      <p className="text-md font-medium text-gray-300 text-center">
        Select a conversation from the inbox to start chatting
      </p>
    </div>
  );
}
