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
import type { InboxChannel } from "@/entities/channel";

export interface UpdateGroupChannelProps {
  channel: InboxChannel;
}

export function UpdateGroupChannel({ channel }: UpdateGroupChannelProps) {
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
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>Update group name and members</DialogDescription>
        </DialogHeader>
        {/* Form for creating group channel */}
        <GroupChannelForm channel={channel} onSuccess={() => setOpen(false)} />
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
