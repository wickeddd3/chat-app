import { FaCircleCheck } from "react-icons/fa6";
import { useTheme, type Theme } from "@/shared/lib/theme";
import { cn } from "@/shared/lib/utils";

// A literal preview of what each theme looks like. Uses fixed palette colors on
// purpose — a "light" swatch must always read light regardless of the active
// theme, so these must NOT use the theme tokens.
function ThemeMockup({ variant }: { variant: "light" | "dark" }) {
  const c =
    variant === "light"
      ? { bg: "bg-white", side: "bg-gray-100", bar: "bg-gray-300" }
      : { bg: "bg-gray-950", side: "bg-gray-800", bar: "bg-gray-600" };

  return (
    <div className={cn("flex h-full w-full", c.bg)}>
      <div className={cn("w-1/4 shrink-0", c.side)} />
      <div className="flex flex-1 flex-col justify-center gap-1.5 p-2">
        <div className={cn("h-1.5 w-3/4 rounded-full", c.bar)} />
        <div className={cn("h-1.5 w-1/2 rounded-full", c.bar)} />
        <div className={cn("h-1.5 w-2/3 rounded-full", c.bar)} />
      </div>
    </div>
  );
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-3 sm:gap-4"
    >
      {OPTIONS.map(({ value, label }) => {
        const selected = theme === value;
        return (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={selected}
              onChange={() => setTheme(value)}
              className="peer sr-only"
            />
            <div
              className={cn(
                "relative rounded-lg border-2 p-1 transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/50",
                selected
                  ? "border-blue-500"
                  : "border-transparent hover:border-border",
              )}
            >
              <div className="h-16 overflow-hidden rounded-md border border-border sm:h-20">
                {value === "system" ? (
                  <div className="flex h-full w-full">
                    <div className="w-1/2 overflow-hidden">
                      <ThemeMockup variant="light" />
                    </div>
                    <div className="w-1/2 overflow-hidden">
                      <ThemeMockup variant="dark" />
                    </div>
                  </div>
                ) : (
                  <ThemeMockup variant={value} />
                )}
              </div>
              {selected && (
                <FaCircleCheck className="absolute right-2 top-2 size-4 text-blue-500" />
              )}
            </div>
            <div className="mt-2 text-center text-sm font-medium">{label}</div>
          </label>
        );
      })}
    </div>
  );
}
