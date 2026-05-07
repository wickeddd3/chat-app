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
import type { InboxChannel } from "@/entities/channel";

export function ChannelDetails({ channel }: { channel: InboxChannel | null }) {
  if (!channel) return;

  return (
    <div className="flex flex-col gap-8 no-scrollbar overflow-y-auto px-4 py-2">
      <Card className="flex justify-center items-center">
        <Avatar className="w-24 h-24">
          <AvatarImage
            src={channel?.displayImage || "/default-avatar.jpg"}
            alt="profile-avatar"
          />
        </Avatar>
      </Card>
      <h1 className="text-md">{channel.displayName}</h1>
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
            <ChannelMembers members={channel.channelMembers} />
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
