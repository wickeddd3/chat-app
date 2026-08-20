import { XIcon } from "@phosphor-icons/react";

export interface UploadProgressRingProps {
  /** 0–100. */
  percent: number;
  /** Aborts the upload. Omitted where the send cannot be called back. */
  onCancel?: (() => void) | undefined;
}

const SIZE = 44;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The determinate ring drawn over a photo while it uploads.
 *
 * An SVG arc rather than a bar: it sits over the image without needing a strip
 * of its own, and it reads at a glance from across the bubble. The percentage
 * is exposed through ARIA, so a screen reader hears progress the sighted user
 * sees.
 */
export function UploadProgressRing({
  percent,
  onCancel,
}: UploadProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Uploading photo"
      className="relative grid place-items-center rounded-full bg-background/75 p-1 backdrop-blur-sm"
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-foreground/15"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-200 ease-out"
        />
      </svg>

      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel upload"
          className="absolute inset-0 grid cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <XIcon className="size-4 text-foreground" />
        </button>
      ) : (
        <span className="absolute text-[10px] font-semibold tabular-nums text-foreground">
          {Math.round(clamped)}
        </span>
      )}
    </div>
  );
}
