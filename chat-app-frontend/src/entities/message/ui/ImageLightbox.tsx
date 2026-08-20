import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";

export interface ImageLightboxProps {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shows a photo at full size over the conversation.
 *
 * The dialog carries a visually hidden title and description because Radix
 * requires both for the announcement, and there is no caption to show here —
 * the caption, when there is one, stays with the message in the timeline.
 */
export function ImageLightbox({ src, open, onOpenChange }: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] border-none bg-transparent p-0 shadow-none sm:max-w-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Photo</DialogTitle>
          <DialogDescription>
            The photo attached to this message, shown full size.
          </DialogDescription>
        </DialogHeader>

        <img
          src={src}
          alt=""
          className="max-h-[85vh] w-full rounded-lg object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
