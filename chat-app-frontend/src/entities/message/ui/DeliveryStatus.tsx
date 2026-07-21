import { ChecksIcon, ClockIcon } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";

export type DeliveryState = "sending" | "delivered" | "read";

export interface DeliveryStatusProps {
  state: DeliveryState;
}

const LABELS: Record<DeliveryState, string> = {
  sending: "Sending",
  delivered: "Delivered",
  read: "Read",
};

/**
 * The fate of a message the reader sent: still in flight, stored by the server,
 * or seen by someone.
 *
 * Colour alone would leave the last two states indistinguishable to anyone who
 * can't separate the hues, so each carries a label for assistive tech — and the
 * in-flight state changes shape rather than just tone.
 */
export function DeliveryStatus({ state }: DeliveryStatusProps) {
  const Icon = state === "sending" ? ClockIcon : ChecksIcon;

  return (
    <Icon
      role="img"
      aria-label={LABELS[state]}
      className={cn(
        "size-3 shrink-0",
        state === "sending" && "opacity-50 animate-pulse",
        state === "delivered" && "opacity-70",
        state === "read" && "text-primary",
      )}
    />
  );
}
