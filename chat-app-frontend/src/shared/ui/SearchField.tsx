import { useId } from "react";
import { Field } from "@/shared/ui/shadcn/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/shadcn/input-group";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}

export function SearchField({
  value,
  onChange = () => {},
  className,
  ariaLabel = "Search",
  placeholder = "Search",
}: SearchFieldProps) {
  // Every mounted search field previously shared one hardcoded id, so any two
  // on screen at once produced duplicates.
  const id = useId();

  return (
    <Field className={className}>
      <InputGroup
        className={cn(
          // A filled pill rather than an outlined box: the field reads as a
          // recess in the panel instead of a control drawn on top of it.
          "h-10 rounded-full border-transparent bg-muted shadow-none transition-colors dark:bg-muted",
          // On focus it lifts to the card surface and takes the brand ring, so
          // the change is a surface change rather than a heavier outline.
          // Written out in full: Tailwind scans source text, so a selector
          // assembled from a variable would never be generated.
          "has-[[data-slot=input-group-control]:focus-visible]:border-ring",
          "has-[[data-slot=input-group-control]:focus-visible]:bg-card",
          "has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]",
          "has-[[data-slot=input-group-control]:focus-visible]:ring-ring/25",
        )}
      >
        <InputGroupInput
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
        <InputGroupAddon align="inline-start">
          <MagnifyingGlassIcon className="transition-colors group-has-[[data-slot=input-group-control]:focus-visible]/input-group:text-primary" />
        </InputGroupAddon>
        {value.length > 0 && (
          <InputGroupAddon align="inline-end">
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className={cn(
                "flex size-5 cursor-pointer items-center justify-center rounded-full",
                "text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              )}
            >
              <XIcon className="size-3.5" />
            </button>
          </InputGroupAddon>
        )}
      </InputGroup>
    </Field>
  );
}
