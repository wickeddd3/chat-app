import { FaUserSlash } from "react-icons/fa6";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <FaUserSlash size={56} className="text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">No people found</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Try a different name, or check back later as more people join.
        </p>
      </div>
    </div>
  );
}
