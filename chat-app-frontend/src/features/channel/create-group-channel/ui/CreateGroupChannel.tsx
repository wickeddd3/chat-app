import { NotePencilIcon } from "@phosphor-icons/react";
import { FormDialog } from "@/shared/ui/FormDialog";
import { GroupChannelForm } from "./GroupChannelForm";
import { useState } from "react";

export function CreateGroupChannel() {
  const [open, setOpen] = useState(false);

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      icon={NotePencilIcon}
      triggerLabel="New group"
      title="New group"
      description="Name the group and pick who joins."
    >
      <GroupChannelForm onSuccess={() => setOpen(false)} />
    </FormDialog>
  );
}
