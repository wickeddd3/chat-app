import { useCallback, useEffect, useRef } from "react";
import { webSocketClient } from "@/shared/lib/socket-io.client";

/** No keystroke for this long ends the burst and sends the "stop". */
const IDLE_MS = 3000;

/**
 * Re-announce interval while the user keeps typing. Must stay comfortably under
 * the receiver's TTL (see `TYPING_TTL_MS`) so a long message never blinks out,
 * and comfortably above the keystroke rate so we don't spam the socket.
 */
const REANNOUNCE_MS = 2000;

/**
 * Broadcasts the local user's typing state for a channel.
 *
 * `notifyTyping` is safe to call on every keystroke — it throttles the "start"
 * signal and arms the idle timer that sends the matching "stop", so the socket
 * sees at most one event per {@link REANNOUNCE_MS}.
 */
export function useTypingBroadcast(channelId: string) {
  const isTypingRef = useRef(false);
  const lastEmitRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitStatus = useCallback(
    (isTyping: boolean) => {
      if (!channelId) return;
      lastEmitRef.current = Date.now();
      webSocketClient.emit("message:typing", { channelId, isTyping });
    },
    [channelId],
  );

  const stopTyping = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (!isTypingRef.current) return;

    isTypingRef.current = false;
    emitStatus(false);
  }, [emitStatus]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();

    if (!isTypingRef.current || now - lastEmitRef.current >= REANNOUNCE_MS) {
      isTypingRef.current = true;
      emitStatus(true);
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopTyping, IDLE_MS);
  }, [emitStatus, stopTyping]);

  // Leaving the room (or switching channels) has to retract the signal, or the
  // other side keeps showing it until the TTL lapses.
  useEffect(() => stopTyping, [stopTyping]);

  return { notifyTyping, stopTyping };
}
