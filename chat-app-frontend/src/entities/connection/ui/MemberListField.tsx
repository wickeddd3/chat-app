import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Field, FieldLabel } from "@/shared/ui/shadcn/field";
import { SearchField } from "@/shared/ui/SearchField";
import { useState } from "react";
import { useContacts } from "../model/useContacts";
import { MemberList } from "./MemberList";

export interface MemberListFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  authId?: string;
}

export function MemberListField<T extends FieldValues>({
  control,
  name,
  label,
  authId,
}: MemberListFieldProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    contacts,
    isLoading,
    appliedQuery,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useContacts(authId, searchQuery);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        // field.value will be our string[] of memberIds
        const selectedIds: string[] = Array.isArray(field.value)
          ? field.value
          : [];

        const toggleMember = (userId: string) => {
          const newIds = selectedIds.includes(userId)
            ? selectedIds.filter((id) => id !== userId)
            : [...selectedIds, userId];

          field.onChange(newIds);
        };

        return (
          <Field>
            <div className="flex items-baseline justify-between gap-2">
              <FieldLabel className="text-md">{label}</FieldLabel>
              {/* Selected members scroll out of view in a long list, so the
                  count is the only persistent feedback that the choice stuck. */}
              <span
                className="text-xs text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {selectedIds.length === 0
                  ? "None selected"
                  : `${selectedIds.length} selected`}
              </span>
            </div>
            <SearchField
              value={searchQuery}
              onChange={setSearchQuery}
              ariaLabel="Search contacts to add"
              placeholder="Search contacts"
            />
            <div className="w-full flex flex-col h-64 overflow-y-auto mt-1 rounded-xl bg-muted/50 scrollbar-thin">
              <MemberList
                users={contacts}
                isLoading={isLoading}
                searchQuery={appliedQuery}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                onToggleMember={toggleMember}
                selectedIds={selectedIds}
              />
            </div>
          </Field>
        );
      }}
    />
  );
}
