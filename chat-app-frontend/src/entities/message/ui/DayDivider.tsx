import { memo } from "react";
import { dayLabel } from "@/shared/utils/date-format";

export interface DayDividerProps {
  /** Any message from the day being opened. */
  date: string;
}

/**
 * Marks where one day's messages end and the next begin, so the clock times on
 * each run stay unambiguous as the timeline scrolls back.
 */
export const DayDivider = memo(function DayDivider({ date }: DayDividerProps) {
  const label = dayLabel(date);

  if (!label) return null;

  return (
    <div className="flex items-center justify-center px-4 pt-5 pb-1">
      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
});
