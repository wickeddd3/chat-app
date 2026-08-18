import { ContainerModule } from "inversify";
import { TYPES } from "@/config/types";
import { NotificationSubscriber } from "@/subscribers/notification.subscriber";
import { RequestSubscriber } from "@/subscribers/request.subscriber";
import { ChannelSubscriber } from "@/subscribers/channel.subscriber";

/**
 * Domain-event subscribers (singletons). Wired to the EventDispatcher in
 * App.initializeEventSubscribers().
 */
export const subscribersModule = new ContainerModule(({ bind }) => {
  bind<NotificationSubscriber>(TYPES.NotificationSubscriber).to(NotificationSubscriber).inSingletonScope();
  bind<RequestSubscriber>(TYPES.RequestSubscriber).to(RequestSubscriber).inSingletonScope();
  bind<ChannelSubscriber>(TYPES.ChannelSubscriber).to(ChannelSubscriber).inSingletonScope();
});
