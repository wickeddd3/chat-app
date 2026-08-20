import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/entities/auth";
import { useAuthProfile } from "@/entities/auth";
import type { Message, NewMessage } from "@/entities/message";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import {
  uploadImageWithProgress,
  UploadAbortedError,
} from "@/shared/lib/supabase-upload";
import type { ReplyTarget } from "./useReplyTarget";
import type { ImageAttachment } from "./useImageAttachment";

/** The public Storage bucket message photos are uploaded into. */
export const MESSAGE_IMAGE_BUCKET = "message-images";

/**
 * Progress is written into the query cache, which re-renders the timeline — so
 * report in steps rather than on every byte event. Five points is finer than
 * the eye resolves on a 44px ring and costs ~20 renders for a whole upload.
 */
const PROGRESS_STEP = 5;

/**
 * `<channelId>/<userId>/<timestamp>.<ext>` — the shape the storage policy reads:
 * it authorises a delete by comparing the second segment to the caller's id.
 */
export function createMessageImagePath(
  channelId: string,
  userId: string,
  file: File,
): string {
  const fromName = file.name.split(".").pop() ?? "";
  const fromType = file.type.split("/").pop() ?? "";
  // Anything unexpected in the extension is dropped rather than sent as part of
  // a storage path.
  const extension = (fromName || fromType)
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

  return `${channelId}/${userId}/${String(Date.now())}.${extension || "bin"}`;
}

export interface UseSendMessageParams {
  channelId: string;
  /** The message being replied to, when the composer has one staged. */
  replyTarget?: ReplyTarget | null;
  /**
   * Pulls the staged photo out of the composer. Ownership of its preview URL
   * transfers to the message being sent, so the composer must not revoke it.
   */
  takeAttachment?: () => ImageAttachment | null;
  /** Fired after a send, so the owner can clear the staged reply. */
  onSent?: () => void;
}

interface PendingUpload {
  attachment: ImageAttachment;
  content: string;
  parentId?: string | undefined;
}

export function useSendMessage({
  channelId,
  replyTarget = null,
  takeAttachment,
  onSent,
}: UseSendMessageParams) {
  const { authUser } = useAuth();
  const { authProfile } = useAuthProfile(authUser?.id);
  const queryClient = useQueryClient();
  const keys = createQueryKeys(authUser?.id);
  const [message, setMessage] = useState("");

  // Everything a failed upload needs to be retried, kept until it succeeds or
  // the room unmounts. Held in a ref because nothing renders from it.
  const pendingUploads = useRef(new Map<string, PendingUpload>());

  const timelineKey = keys.messages.timeline(channelId);

  const handleOptimisticMessage = (newMessage: NewMessage) => {
    queryClient.setQueryData(
      // Must match the timeline key useMessages reads + handleIncomingMessage
      // reconciles against, or the optimistic message writes to a phantom cache
      // entry and the sender never sees their own message.
      timelineKey,
      (oldData: { pages: { messages: (Message | NewMessage)[] }[] }) => {
        if (!oldData) return oldData;

        const updatedPages = [...oldData.pages];

        // Push optimistic items to page 0, because it represents the newest timeline batch
        if (updatedPages[0]) {
          updatedPages[0] = {
            ...updatedPages[0],
            messages: [...updatedPages[0].messages, newMessage],
          };
        }

        // Push optimistic updates into the cache
        return { ...oldData, pages: updatedPages };
      },
    );
  };

  /** Patches one in-flight message in place, found by its client id. */
  const patchOptimisticMessage = useCallback(
    (clientId: string, fields: Partial<NewMessage>) => {
      queryClient.setQueryData(
        timelineKey,
        (oldData: { pages: { messages: (Message | NewMessage)[] }[] }) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.clientId === clientId ? { ...m, ...fields } : m,
              ),
            })),
          };
        },
      );
    },
    [queryClient, timelineKey],
  );

  const handleSendMessageToServer = useCallback(
    ({
      clientId,
      content,
      parentId,
      image,
    }: {
      clientId: string;
      content: string;
      parentId?: string | undefined;
      image?: { url: string; width: number | null; height: number | null };
    }) => {
      // Emit message to websocket server. Optional fields are omitted entirely
      // rather than sent as null — the server's schema takes them as optional.
      webSocketClient.emit("message:send_message", {
        channelId,
        clientId,
        content,
        ...(parentId && { parentId }),
        ...(image && {
          imageUrl: image.url,
          ...(image.width && { imageWidth: image.width }),
          ...(image.height && { imageHeight: image.height }),
        }),
      });
    },
    [channelId],
  );

  /**
   * Uploads the photo, reporting progress onto its own bubble, then sends the
   * message pointing at the stored file.
   *
   * The bytes go browser → Supabase Storage directly; only the resulting URL
   * reaches our API, so a photo never costs us double bandwidth.
   */
  const uploadAndSend = useCallback(
    async (clientId: string, pending: PendingUpload) => {
      const { attachment, content, parentId } = pending;
      const userId = authProfile?.id ?? authUser?.id;

      if (!userId) {
        patchOptimisticMessage(clientId, { uploadFailed: true });
        return;
      }

      patchOptimisticMessage(clientId, {
        uploadProgress: 0,
        uploadFailed: false,
      });

      let lastReported = 0;

      try {
        const publicUrl = await uploadImageWithProgress(
          attachment.file,
          createMessageImagePath(channelId, userId, attachment.file),
          MESSAGE_IMAGE_BUCKET,
          {
            onProgress: (percent) => {
              if (percent < 100 && percent - lastReported < PROGRESS_STEP) {
                return;
              }
              lastReported = percent;
              patchOptimisticMessage(clientId, { uploadProgress: percent });
            },
          },
        );

        pendingUploads.current.delete(clientId);

        // The bubble keeps its local preview until the server echoes the stored
        // message back — swapping to the remote URL here would blank the image
        // for as long as it takes to fetch what is already on screen.
        patchOptimisticMessage(clientId, { uploadProgress: 100 });

        handleSendMessageToServer({
          clientId,
          content,
          parentId,
          image: {
            url: publicUrl,
            width: attachment.width,
            height: attachment.height,
          },
        });
      } catch (error) {
        if (error instanceof UploadAbortedError) return;

        // The message stays on screen carrying its failure, so the photo can be
        // retried without picking it again.
        patchOptimisticMessage(clientId, {
          uploadFailed: true,
          uploadProgress: undefined,
        });
        toast.error(
          error instanceof Error ? error.message : "Could not send that photo.",
        );
      }
    },
    [
      authProfile?.id,
      authUser?.id,
      channelId,
      patchOptimisticMessage,
      handleSendMessageToServer,
    ],
  );

  const sendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const attachment = takeAttachment?.() ?? null;
    const content = message;

    // A photo may travel without a caption, but an empty message may not.
    if (content.trim() === "" && !attachment) return;

    // 1. Generate a temporary unique ID
    const clientId = window.crypto.randomUUID();

    // 2. Create the message object with optimistic data. The staged reply and
    // the local photo preview are carried on it, so the bubble renders complete
    // before the server echoes it back.
    const messageData: NewMessage = {
      clientId,
      channelId,
      content,
      author: {
        id: authProfile?.id,
        name: authProfile?.name,
        image: authProfile?.image,
      },
      createdAt: new Date().toISOString(),
      isSending: true,
      ...(replyTarget && { parentId: replyTarget.id, parent: replyTarget }),
      ...(attachment && {
        previewUrl: attachment.previewUrl,
        imageWidth: attachment.width,
        imageHeight: attachment.height,
        uploadProgress: 0,
      }),
    };

    // 3. Update UI immediately
    handleOptimisticMessage(messageData);

    // 4. Send to server. A photo has to be stored before the message can point
    // at it, so that send waits on the upload.
    const parentId = replyTarget?.id;
    if (attachment) {
      const pending: PendingUpload = { attachment, content, parentId };
      pendingUploads.current.set(clientId, pending);
      void uploadAndSend(clientId, pending);
    } else {
      handleSendMessageToServer({ clientId, content, parentId });
    }

    // 5. Reset message input and retire the staged reply
    setMessage("");
    onSent?.();
  };

  /** Re-runs a photo upload that failed, for the message with this client id. */
  const retryUpload = useCallback(
    (clientId: string) => {
      const pending = pendingUploads.current.get(clientId);
      if (!pending) return;

      void uploadAndSend(clientId, pending);
    },
    [uploadAndSend],
  );

  return {
    message,
    setMessage,
    sendMessage,
    retryUpload,
  };
}
