import { Field } from "@/shared/ui/shadcn/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/shadcn/input-group";
import { SearchIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function SearchField({
  value,
  onChange = () => {},
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Field className={cn("", className)}>
      <InputGroup className="rounded-full">
        <InputGroupInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          id="input-search-query"
          placeholder="Search"
        />
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
