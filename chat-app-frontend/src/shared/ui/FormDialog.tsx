import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Icon for both the trigger button and the header mark. */
  icon: Icon;
  /** Accessible name for the trigger, also shown as its tooltip. */
  triggerLabel: string;
  title: string;
  description: string;
  children: ReactNode;
}

/**
 * Dialog shell for the group channel forms, which are the same screen with
 * different copy and a different submit action.
 *
 * The header leads with the icon on a tinted mark rather than plain text, so
 * the dialog opens with the same object the trigger showed — the icon carries
 * across the transition instead of the panel starting from nothing.
 */
export function FormDialog({
  open,
  onOpenChange,
  icon: Glyph,
  triggerLabel,
  title,
  description,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={triggerLabel}
              className="rounded-full cursor-pointer"
            >
              <Glyph weight="duotone" className="size-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{triggerLabel}</TooltipContent>
      </Tooltip>

      <DialogContent
        className="sm:max-w-lg flex flex-col gap-5"
        // Half-filled forms should not vanish on a stray click outside.
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Glyph weight="duotone" className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-base">{title}</DialogTitle>
            <DialogDescription className="text-sm">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
