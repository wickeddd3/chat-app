import { ChevronLeftIcon } from "lucide-react";
import { useNavigate } from "react-router";

export function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/messages")}
      className="p-2 ml-2 mr-1 rounded-lg hover:bg-muted md:hidden cursor-pointer"
      aria-label="Back to inbox"
      role="button"
      title="Back to inbox"
    >
      <ChevronLeftIcon className="h-6 w-6 text-muted-foreground" />
    </button>
  );
}
