import { Field } from "@/shared/ui/shadcn/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/shadcn/input-group";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { cn } from "@/shared/lib/utils";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function SearchField({
  value,
  onChange = () => {},
  className = "",
  ariaLabel = "Search",
}: SearchFieldProps) {
  return (
    <Field className={cn("", className)}>
      <InputGroup className="rounded-full">
        <InputGroupInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          id="input-search-query"
          placeholder="Search"
          aria-label={ariaLabel}
        />
        <InputGroupAddon align="inline-start">
          <FaMagnifyingGlass />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
