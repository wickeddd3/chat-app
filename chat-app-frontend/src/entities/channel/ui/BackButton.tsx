import { CaretLeftIcon } from "@phosphor-icons/react";
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
      <CaretLeftIcon className="size-4 text-muted-foreground" />
    </button>
  );
}
