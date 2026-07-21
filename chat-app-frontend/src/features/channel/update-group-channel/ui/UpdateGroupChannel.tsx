import { PencilSimpleLineIcon } from "@phosphor-icons/react";
import { FormDialog } from "@/shared/ui/FormDialog";
import { GroupChannelForm } from "./GroupChannelForm";
import { useState } from "react";
import type { InboxChannel } from "@/entities/channel";

export interface UpdateGroupChannelProps {
  channel: InboxChannel;
}

export function UpdateGroupChannel({ channel }: UpdateGroupChannelProps) {
  const [open, setOpen] = useState(false);

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      icon={PencilSimpleLineIcon}
      triggerLabel="Edit group"
      title="Edit group"
      description="Change the name or who belongs to this group."
    >
      <GroupChannelForm channel={channel} onSuccess={() => setOpen(false)} />
    </FormDialog>
  );
}
