import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/entities/auth";
import { useChannel } from "@/entities/channel";
import { useTypingUsers } from "@/entities/message";
import { fadeVariants } from "@/shared/lib/motion";

export interface TypingIndicatorProps {
  channelId: string;
}

/**
 * Sits in a fixed-height slot between the timeline and the composer, so the
 * messages above never shift when someone starts or stops typing.
 */
export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const { authUser } = useAuth();
  // Already fetched by the page around us — this resolves from cache.
  const { channel } = useChannel(channelId, authUser?.id);

  const participants = useMemo(
    () => channel?.channelMembers?.map(({ user }) => user),
    [channel?.channelMembers],
  );

  const { isTyping, label } = useTypingUsers({
    channelId,
    authId: authUser?.id,
    participants,
  });

  return (
    <div className="h-5 px-4" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {isTyping && (
          <motion.p
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className="flex items-end gap-0.5" aria-hidden="true">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            <span className="truncate">{label}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
