import { useNavigate } from "react-router";
import { FaTriangleExclamation } from "react-icons/fa6";
import { Button } from "@/shared/ui/shadcn/button";

/**
 * Shown when the requested channel can't be opened — it doesn't exist, the user
 * isn't a member, or the channel id in the URL is invalid. Gives the user a way
 * back to the messages home instead of a blank or broken chat room.
 */
export function ChannelUnavailablePlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
      <FaTriangleExclamation className="text-muted-foreground" size={40} />
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">
          Channel unavailable
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          This conversation doesn't exist or you don't have access to it.
        </p>
      </div>
      <Button onClick={() => navigate("/messages")} className="cursor-pointer">
        Go home
      </Button>
    </div>
  );
}
