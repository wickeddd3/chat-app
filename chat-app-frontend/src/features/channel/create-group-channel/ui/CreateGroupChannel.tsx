import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { SquarePenIcon } from "lucide-react";
import { GroupChannelForm } from "./GroupChannelForm";
import { useState } from "react";

export function CreateGroupChannel() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <SquarePenIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg flex flex-col gap-3"
        showCloseButton={false}
      >
        <DialogHeader className="pb-4">
          <DialogTitle>New Group</DialogTitle>
          <DialogDescription>
            Create a group and chat with group of people
          </DialogDescription>
        </DialogHeader>
        {/* Form for creating group channel */}
        <GroupChannelForm onSuccess={() => setOpen(false)} />
        <Button
          variant="outline"
          className="w-full font-semibold cursor-pointer"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
