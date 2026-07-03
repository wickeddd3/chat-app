import { FaFile } from "react-icons/fa6";

export function AttachmentFiles() {
  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <FaFile size={40} className="text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}
