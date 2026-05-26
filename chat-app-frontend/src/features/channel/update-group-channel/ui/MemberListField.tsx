import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Field, FieldLabel } from "@/shared/ui/shadcn/field";
import { Input } from "@/shared/ui/shadcn/input";
import { useState } from "react";
import { useContacts } from "../model/useContacts";
import { MemberList } from "./MemberList";

interface MemberListFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
}

export function MemberListField<T extends FieldValues>({
  control,
  name,
  label,
}: MemberListFieldProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const { contacts, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useContacts(searchQuery);

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
            <FieldLabel className="text-md">{label}</FieldLabel>
            <Input
              placeholder="Search and select members"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="w-full flex flex-col h-64 overflow-y-auto mt-2 border rounded-md divide-y">
              <MemberList
                users={contacts}
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
