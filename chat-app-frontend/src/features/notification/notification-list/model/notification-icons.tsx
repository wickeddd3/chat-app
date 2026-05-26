import type { NotificationType } from "@/entities/notification";
import { MailIcon, UserRoundCheckIcon, UserRoundPlusIcon } from "lucide-react";
import type { ElementType } from "react";

export const iconType: Record<NotificationType, ElementType> = {
  CONNECTION_REQUEST: UserRoundPlusIcon,
  CONNECTION_ACCEPTED: UserRoundCheckIcon,
  CHANNEL_INVITE: MailIcon,
};
