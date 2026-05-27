import { formatDistanceToNow, isValid } from "date-fns";

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
