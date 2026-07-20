import { FileIcon } from "@phosphor-icons/react";

export function AttachmentFiles() {
  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <FileIcon className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}
