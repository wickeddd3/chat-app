import { TabsList, TabsTrigger } from "@/shared/ui/shadcn/tabs";
import { Badge } from "@/shared/ui/shadcn/badge";
import { cn } from "@/shared/lib/utils";

/**
 * A segmented control built on the shadcn tabs primitives: a recessed rail with
 * one raised segment marking the active tab.
 *
 * Elevation has to be expressed differently per theme. On light the page is the
 * lightest surface, so the rail sinks below it (`muted`) and the active segment
 * rises back to `card`. On dark every surface steps *up* in lightness from the
 * page, so the rail is `card` and the active segment has to go lighter still —
 * `muted` plus a border — or it would read as pressed rather than raised.
 */
export function SegmentedTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        "h-auto gap-0.5 rounded-full bg-muted p-1 dark:bg-card",
        className,
      )}
      {...props}
    />
  );
}

export function SegmentedTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      // `group/tab` lets the count badge react to the active state — see
      // SEGMENTED_TAB_BADGE below.
      className={cn(
        "group/tab cursor-pointer gap-2 rounded-full px-3.5 py-1.5 text-sm",
        "text-muted-foreground data-active:text-foreground",
        "data-active:bg-card data-active:shadow-sm",
        "dark:data-active:border-border dark:data-active:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Count badge for a tab inside a segmented control.
 *
 * The badge sits on two different grounds — the rail when its tab is inactive,
 * the raised segment when active — so a fixed background would disappear
 * against one of them. A translucent foreground tint reads on both, and the
 * active tab promotes its count to the brand colour.
 */
export function SegmentedTabBadge({
  className,
  ...props
}: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      className={cn(
        "rounded-full border-transparent bg-foreground/10 px-1.5 font-semibold tabular-nums text-foreground/70",
        "group-data-active/tab:bg-primary group-data-active/tab:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}
