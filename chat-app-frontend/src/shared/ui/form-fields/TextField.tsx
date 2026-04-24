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

interface TextInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>; // Ensures the name matches a key in the form schema
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  description?: string;
  className?: string;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  type = "text",
  placeholder = "",
  description = "",
  className = "",
}: TextInputFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={cn("", className)}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...field}
            type={type}
            id={id}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            autoComplete={name}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
