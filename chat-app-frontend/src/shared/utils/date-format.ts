import { differenceInHours, formatDistanceToNow, isValid } from "date-fns";

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

export function isLessThanADayOld(date: string): boolean {
  if (!isValid(new Date(date))) {
    return false;
  }

  const dateToCheck = new Date(date);
  const dateNow = new Date();
  const isLessThanADayOld = differenceInHours(dateNow, dateToCheck) < 24;

  return isLessThanADayOld;
}
