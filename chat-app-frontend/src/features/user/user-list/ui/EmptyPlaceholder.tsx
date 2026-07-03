import { FaUsers } from "react-icons/fa6";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4">
      <FaUsers size={60} className="text-muted-foreground" />
      <p className="text-lg font-medium text-muted-foreground">Empty</p>
    </div>
  );
}
