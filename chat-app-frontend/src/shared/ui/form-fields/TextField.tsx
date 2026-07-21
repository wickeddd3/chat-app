import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/shadcn/field";
import { Input } from "@/shared/ui/shadcn/input";
import { cn } from "@/shared/lib/utils";

export interface TextInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>; // Ensures the name matches a key in the form schema
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  description?: string;
  /** `lg` is the roomier form used on the account pages. */
  size?: "default" | "lg";
  /**
   * Overrides the field name as the autocomplete token. The name is a fine
   * default for `email` or `username`, but some fields need a real token —
   * `confirmPassword` is not one, so browsers ignore it.
   */
  autoComplete?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const inputSizes = {
  default: "h-10 rounded-xl px-3.5",
  lg: "h-12 rounded-2xl px-4",
} as const;

export function TextField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  type = "text",
  placeholder = "",
  description = "",
  size = "default",
  autoComplete,
  inputClassName = "",
  labelClassName = "",
}: TextInputFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id} className={cn("text-sm", labelClassName)}>
            {label}
          </FieldLabel>
          <Input
            {...field}
            type={type}
            id={id}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            autoComplete={autoComplete ?? name}
            className={cn(
              // Filled recess rather than an outlined box, matching the search
              // field: the input reads as part of the panel, and focus is a
              // surface change rather than a heavier outline.
              "border-transparent bg-muted text-sm shadow-none transition-colors dark:bg-muted",
              "focus-visible:border-ring focus-visible:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/25",
              // The previous implementation zeroed both rings, so focus was
              // signalled by a border tint alone and invalid added nothing.
              "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25",
              inputSizes[size],
              inputClassName,
            )}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && (
            <FieldError className="text-xs" errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  );
}
