import { useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { tokenizeMessageLinks } from "../model/message-links";

export interface MessageContentProps {
  content: string;
  /** Links sit on the primary fill in the reader's own bubble, muted in others. */
  isAuthorsMessage: boolean;
}

/**
 * Renders message text, turning any URLs in it into links.
 *
 * Tokens render as React children rather than markup, so the text is escaped
 * exactly as it was before — the only thing this adds is an anchor around runs
 * that already passed the scheme check.
 */
export function MessageContent({
  content,
  isAuthorsMessage,
}: MessageContentProps) {
  const tokens = useMemo(() => tokenizeMessageLinks(content), [content]);

  return (
    <>
      {tokens.map((token, index) =>
        token.type === "link" ? (
          <a
            key={index}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              `underline underline-offset-2 font-medium
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-xs`,
              // On the teal fill, a coloured link would lose contrast — so it
              // leans on weight and the underline instead of a hue change.
              isAuthorsMessage
                ? "decoration-primary-foreground/50 hover:decoration-primary-foreground focus-visible:outline-current"
                : "text-primary decoration-primary/40 hover:decoration-primary focus-visible:outline-ring",
            )}
          >
            {token.value}
          </a>
        ) : (
          token.value
        ),
      )}
    </>
  );
}
