import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { MessageReceiptsService } from "./message-receipts.service";
import { MessageReceiptsRepository } from "./message-receipts.repository";

export const messageReceiptsModule = new ContainerModule(({ bind }) => {
  bind<MessageReceiptsService>(TYPES.MessageReceiptsService).to(MessageReceiptsService);
  bind<MessageReceiptsRepository>(TYPES.MessageReceiptsRepository).to(MessageReceiptsRepository);
});
