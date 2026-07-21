import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { ListEmptyState, type ListEmptyStateProps } from "./ListEmptyState";

export interface NoSearchResultsProps {
  /** The search that came back empty. Shown verbatim so the user can spot a typo. */
  query: string;
  /** Plural noun for what was searched, e.g. "conversations". */
  noun: string;
  size?: ListEmptyStateProps["size"];
}

/**
 * Shown when a list is empty *because of a search*, as opposed to being empty
 * outright. The distinction matters: an empty collection needs a nudge toward
 * filling it, while an empty search needs the query echoed back and a way out.
 */
export function NoSearchResults({
  query,
  noun,
  size = "page",
}: NoSearchResultsProps) {
  return (
    <ListEmptyState
      icon={MagnifyingGlassIcon}
      size={size}
      title={`No ${noun} found`}
      description={
        <>
          Nothing matches{" "}
          <span className="font-medium text-foreground break-all">
            &ldquo;{query}&rdquo;
          </span>
          . Try a different spelling or a shorter search.
        </>
      }
    />
  );
}
