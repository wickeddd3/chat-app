import { FaBell } from "react-icons/fa6";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4">
      <FaBell size={60} className="text-gray-300" />
      <p className="text-lg font-medium text-gray-300">No notifications</p>
    </div>
  );
}
