import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { UserAvatar } from "@/entities/user";
import { Field, FieldLabel } from "@/shared/ui/shadcn/field";
import { Input } from "@/shared/ui/shadcn/input";
import { useState } from "react";
import { useUsers } from "../model/useUsers";

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
  const { users } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="w-full flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleMember(user.id)}
                >
                  <div className="flex-1 flex items-center gap-4">
                    <UserAvatar imageSrc={user.image || ""} size="lg" />
                    <div className="flex flex-col">
                      <h6 className="font-medium text-sm">{user.name}</h6>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    // Use checked for controlled component
                    checked={selectedIds.includes(user.id)}
                    // Stop propagation so clicking the checkbox doesn't trigger the div's onClick
                    onClick={(e) => e.stopPropagation()}
                    // Use onChange to keep the form state in sync
                    onChange={() => toggleMember(user.id)}
                    className="h-4 w-4 cursor-pointer accent-blue-500"
                  />
                </div>
              ))}
            </div>
          </Field>
        );
      }}
    />
  );
}
