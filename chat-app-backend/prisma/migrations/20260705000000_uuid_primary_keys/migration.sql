-- DropForeignKey
ALTER TABLE "channel_members" DROP CONSTRAINT "channel_members_channelId_fkey";

-- DropForeignKey
ALTER TABLE "message_receipts" DROP CONSTRAINT "message_receipts_messageId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_channelId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_parentId_fkey";

-- DropIndex
DROP INDEX "channels_id_idx";

-- AlterTable
ALTER TABLE "channel_members" DROP CONSTRAINT "channel_members_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "channelId" SET DATA TYPE TEXT,
ADD CONSTRAINT "channel_members_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "channel_members_id_seq";

-- AlterTable
ALTER TABLE "channels" DROP CONSTRAINT "channels_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "channels_id_seq";

-- AlterTable
ALTER TABLE "message_receipts" DROP CONSTRAINT "message_receipts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "messageId" SET DATA TYPE TEXT,
ADD CONSTRAINT "message_receipts_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "message_receipts_id_seq";

-- AlterTable
ALTER TABLE "messages" DROP CONSTRAINT "messages_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "channelId" SET DATA TYPE TEXT,
ALTER COLUMN "parentId" SET DATA TYPE TEXT,
ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "messages_id_seq";

-- AddForeignKey
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

