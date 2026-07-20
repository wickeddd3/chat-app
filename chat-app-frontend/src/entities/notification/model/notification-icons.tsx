import type { NotificationType } from "./notification.types";
import {
  EnvelopeIcon,
  UserCheckIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import type { ElementType } from "react";

export const iconType: Record<NotificationType, ElementType> = {
  CONNECTION_REQUEST: UserPlusIcon,
  CONNECTION_ACCEPTED: UserCheckIcon,
  CHANNEL_INVITE: EnvelopeIcon,
};
