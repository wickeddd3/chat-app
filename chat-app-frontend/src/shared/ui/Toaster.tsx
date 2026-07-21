import { useTheme } from "@/shared/lib/theme";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CheckCircleIcon,
  InfoIcon,
  WarningIcon,
  XCircleIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react";

/**
 * Toasts on the app's own palette.
 *
 * Sonner's `richColors` paints whole toasts in its built-in red and green,
 * which ignores the theme tokens and reads as a different product. Instead the
 * surface stays `popover` and the type is carried by a coloured icon and a rail
 * on the leading edge — the same device the unread notification row uses, so
 * severity reads consistently across the app.
 */
export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      // Top-right stays clear of the bottom navigation bar on mobile.
      position="top-right"
      closeButton
      offset={16}
      gap={10}
      className="toaster group"
      // Coloured here rather than through a per-type class: an arbitrary
      // variant targeting the icon slot needs nested brackets, which Tailwind's
      // extractor does not parse, so those classes are never generated.
      icons={{
        success: (
          <CheckCircleIcon weight="fill" className="size-5 text-primary" />
        ),
        info: <InfoIcon weight="fill" className="size-5 text-foreground/60" />,
        warning: <WarningIcon weight="fill" className="size-5 text-chart-2" />,
        error: (
          <XCircleIcon weight="fill" className="size-5 text-destructive" />
        ),
        loading: (
          <CircleNotchIcon className="size-5 animate-spin text-muted-foreground" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast items-start gap-3 rounded-2xl border border-l-3 border-border bg-popover p-4 text-popover-foreground shadow-lg",
          title: "text-sm font-semibold leading-snug",
          description: "text-[13px] leading-snug text-muted-foreground",
          icon: "mt-px shrink-0",
          closeButton:
            "rounded-full border-transparent bg-transparent opacity-60 transition-opacity hover:opacity-100",
          // Only the rail and the icon carry the type, so the toast keeps the
          // same surface and text contrast whatever it is reporting.
          success: "border-l-primary",
          error: "border-l-destructive",
          warning: "border-l-chart-2",
          info: "border-l-foreground/40",
          loading: "border-l-border",
        },
      }}
      {...props}
    />
  );
}
