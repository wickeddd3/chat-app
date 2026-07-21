import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/shadcn/accordion";
import { Card } from "@/shared/ui/shadcn/card";
import { Avatar, AvatarImage } from "@/shared/ui/shadcn/avatar";
import { ChannelMembers } from "./ChannelMembers";
import { AttachmentFiles } from "./AttachmentFiles";
import type { InboxChannel } from "../model/channel.types";

export interface ChannelDetailsProps {
  channel: InboxChannel | null;
  // Presence is injected from a higher layer so this entity stays decoupled
  // from the auth/presence entity (entities may only depend on shared).
  isOnline: (userId: string) => boolean;
}

export function ChannelDetails({ channel, isOnline }: ChannelDetailsProps) {
  if (!channel) return;

  return (
    <div className="flex flex-col gap-8 no-scrollbar overflow-y-auto px-4 py-2">
      <Card className="flex justify-center items-center">
        <Avatar className="w-24 h-24">
          <AvatarImage
            src={channel?.displayImage || "/default-avatar.jpg"}
            alt=""
          />
        </Avatar>
      </Card>
      <h2 className="text-md">{channel.displayName}</h2>
      <Accordion
        type="single"
        collapsible
        defaultValue="members"
        className="max-w-lg"
      >
        <AccordionItem value="members">
          <AccordionTrigger className="cursor-pointer">
            Members
          </AccordionTrigger>
          <AccordionContent className="w-full h-full">
            <ChannelMembers
              members={channel.channelMembers}
              isOnline={isOnline}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="attachments">
          <AccordionTrigger className="cursor-pointer">
            Attachments
          </AccordionTrigger>
          <AccordionContent className="w-full h-full p-12">
            <AttachmentFiles />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
