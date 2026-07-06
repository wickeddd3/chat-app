import { useState } from "react";
import { FaRegFaceSmile } from "react-icons/fa6";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { cn } from "@/shared/lib/utils";
import { EMOJI_CATEGORIES } from "./emoji-data";

export interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  /** Optional class for the trigger button. */
  className?: string;
}

/**
 * Lightweight, dependency-free emoji picker. Opens a popover with category tabs
 * and a scrollable grid; stays open on select so several emojis can be added in
 * a row. Purely presentational — the caller decides where the emoji goes.
 */
export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [activeId, setActiveId] = useState(EMOJI_CATEGORIES[0].id);
  const active =
    EMOJI_CATEGORIES.find((category) => category.id === activeId) ??
    EMOJI_CATEGORIES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Insert emoji"
          title="Insert emoji"
          className={cn(
            "px-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors",
            className,
          )}
        >
          <FaRegFaceSmile className="size-6" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-[320px] p-2"
        // Keep the message input's caret/selection intact when the picker opens.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="mb-2 flex items-center gap-1 overflow-x-auto border-b pb-2">
          {EMOJI_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-label={category.label}
              title={category.label}
              aria-pressed={category.id === activeId}
              onClick={() => setActiveId(category.id)}
              className={cn(
                "shrink-0 rounded-md p-1.5 text-lg leading-none transition-colors hover:bg-muted cursor-pointer",
                category.id === activeId && "bg-muted",
              )}
            >
              {category.icon}
            </button>
          ))}
        </div>
        <div
          className="grid max-h-52 grid-cols-8 gap-0.5 overflow-y-auto"
          role="grid"
          aria-label={active.label}
        >
          {active.emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={emoji}
              onClick={() => onSelect(emoji)}
              className="rounded p-1 text-xl leading-none transition-colors hover:bg-muted cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
