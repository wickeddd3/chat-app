import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { FaPenToSquare } from "react-icons/fa6";
import { GroupChannelForm } from "./GroupChannelForm";
import { useState } from "react";
import type { InboxChannel } from "@/entities/channel";

export interface UpdateGroupChannelProps {
  channel: InboxChannel;
}

export function UpdateGroupChannel({ channel }: UpdateGroupChannelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <FaPenToSquare />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg flex flex-col gap-3"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4">
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>Update group name and members</DialogDescription>
        </DialogHeader>
        {/* Form for creating group channel */}
        <GroupChannelForm channel={channel} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
