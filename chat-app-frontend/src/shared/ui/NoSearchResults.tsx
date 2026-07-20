import { MagnifyingGlassIcon } from "@phosphor-icons/react";

export interface NoSearchResultsProps {
  /** The search that came back empty. Shown verbatim so the user can spot a typo. */
  query: string;
  /** Plural noun for what was searched, e.g. "conversations". */
  noun: string;
}

/**
 * Shown when a list is empty *because of a search*, as opposed to being empty
 * outright. The distinction matters: an empty collection needs a nudge toward
 * filling it, while an empty search needs the query echoed back and a way out.
 */
export function NoSearchResults({ query, noun }: NoSearchResultsProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <MagnifyingGlassIcon
        weight="duotone"
        className="size-14 text-muted-foreground"
      />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">No {noun} found</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Nothing matches{" "}
          <span className="font-medium text-foreground break-all">
            &ldquo;{query}&rdquo;
          </span>
          . Try a different spelling or a shorter search.
        </p>
      </div>
    </div>
  );
}
