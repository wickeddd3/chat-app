import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { NotePencilIcon } from "@phosphor-icons/react";
import { GroupChannelForm } from "./GroupChannelForm";
import { useState } from "react";

export function CreateGroupChannel() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <NotePencilIcon weight="duotone" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg flex flex-col gap-3"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4">
          <DialogTitle>New Group</DialogTitle>
          <DialogDescription>
            Create a group and chat with group of people
          </DialogDescription>
        </DialogHeader>
        {/* Form for creating group channel */}
        <GroupChannelForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
