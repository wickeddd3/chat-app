import type { NotificationType } from "./notification.types";
import { FaEnvelope, FaUserCheck, FaUserPlus } from "react-icons/fa6";
import type { ElementType } from "react";

export const iconType: Record<NotificationType, ElementType> = {
  CONNECTION_REQUEST: FaUserPlus,
  CONNECTION_ACCEPTED: FaUserCheck,
  CHANNEL_INVITE: FaEnvelope,
};
