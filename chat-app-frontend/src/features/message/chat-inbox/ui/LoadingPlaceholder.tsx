import { LoaderCircle } from "lucide-react";

export function LoadingPlaceholder() {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <LoaderCircle size={60} className="text-blue-500 animate-spin" />
    </div>
  );
}
