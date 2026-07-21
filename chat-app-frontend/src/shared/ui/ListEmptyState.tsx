import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface ListEmptyStateProps {
  icon: Icon;
  title: string;
  description?: ReactNode;
  /**
   * `page` fills an empty panel; `panel` fits inside a bordered box such as the
   * member picker, where the page-sized icon would crowd out the message.
   */
  size?: "page" | "panel";
  className?: string;
}

const sizes = {
  page: {
    wrap: "h-full gap-4 p-6",
    icon: "size-14",
    title: "text-lg",
    body: "text-sm max-w-xs",
  },
  panel: {
    wrap: "h-full gap-2 p-4",
    icon: "size-8",
    title: "text-sm",
    body: "text-xs max-w-[15rem]",
  },
} as const;

/**
 * The shared shape for "there is nothing here": a duotone glyph, a statement of
 * what is missing, and a line on what to do about it. Keeping both sizes in one
 * component is what stops a placeholder inside a panel from drifting away from
 * the full-page ones.
 */
export function ListEmptyState({
  icon: Glyph,
  title,
  description,
  size = "page",
  className,
}: ListEmptyStateProps) {
  const s = sizes[size];

  return (
    <div
      className={cn(
        "w-full flex flex-col justify-center items-center text-center",
        s.wrap,
        className,
      )}
    >
      <Glyph weight="duotone" className={cn(s.icon, "text-muted-foreground")} />
      <div className="flex flex-col gap-1">
        <p className={cn("font-semibold text-foreground", s.title)}>{title}</p>
        {description && (
          <p className={cn("text-muted-foreground", s.body)}>{description}</p>
        )}
      </div>
    </div>
  );
}
