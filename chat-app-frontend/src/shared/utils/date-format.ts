import {
  differenceInHours,
  formatDistanceToNow,
  isThisYear,
  isToday,
  isValid,
  isYesterday,
} from "date-fns";

export function dateToString(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateToNow(date: string): string {
  if (!isValid(new Date(date))) {
    return "";
  }

  return formatDistanceToNow(new Date(date), {
    includeSeconds: true,
    addSuffix: true,
  });
}

/**
 * Names the day a message belongs to, for the timeline's date dividers.
 *
 * The two most recent days are named rather than dated — nobody reads "20 July"
 * and thinks "yesterday". Every older day leads with its weekday, which is what
 * people actually recall a conversation by, and the year only appears once it
 * isn't the current one. Ordering follows the viewer's locale, as
 * `dateToString` does.
 */
export function dayLabel(date: string): string {
  const parsed = new Date(date);

  if (!isValid(parsed)) {
    return "";
  }

  if (isToday(parsed)) return "Today";
  if (isYesterday(parsed)) return "Yesterday";

  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(isThisYear(parsed) ? {} : { year: "numeric" }),
  });
}

export function isLessThanADayOld(date: string): boolean {
  if (!isValid(new Date(date))) {
    return false;
  }

  const dateToCheck = new Date(date);
  const dateNow = new Date();
  const isLessThanADayOld = differenceInHours(dateNow, dateToCheck) < 24;

  return isLessThanADayOld;
}
