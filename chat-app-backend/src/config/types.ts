export const TYPES = {
  PrismaClient: Symbol.for("PrismaClient"),

  AuthRouter: Symbol.for("AuthRouter"),
  AuthController: Symbol.for("AuthController"),
  AuthService: Symbol.for("AuthService"),
  AuthRepository: Symbol.for("AuthRepository"),

  UsersRouter: Symbol.for("UsersRouter"),
  UsersController: Symbol.for("UsersController"),
  UsersService: Symbol.for("UsersService"),
  UsersRepository: Symbol.for("UsersRepository"),

  ChannelsRouter: Symbol.for("ChannelsRouter"),
  ChannelsController: Symbol.for("ChannelsController"),
  ChannelsService: Symbol.for("ChannelsService"),
  ChannelsRepository: Symbol.for("ChannelsRepository"),

  MessagesRouter: Symbol.for("MessagesRouter"),
  MessagesController: Symbol.for("MessagesController"),
  MessagesService: Symbol.for("MessagesService"),
  MessagesRepository: Symbol.for("MessagesRepository"),

  MessageReceiptsService: Symbol.for("MessageReceiptsService"),
  MessageReceiptsRepository: Symbol.for("MessageReceiptsRepository"),

  ConnectionsRouter: Symbol.for("ConnectionsRouter"),
  ConnectionsController: Symbol.for("ConnectionsController"),
  ConnectionsService: Symbol.for("ConnectionsService"),
  ConnectionsRepository: Symbol.for("ConnectionsRepository"),

  NotificationsRouter: Symbol.for("NotificationsRouter"),
  NotificationsController: Symbol.for("NotificationsController"),
  NotificationsService: Symbol.for("NotificationsService"),
  NotificationsRepository: Symbol.for("NotificationsRepository"),

  SocketServerProvider: Symbol.for("SocketServerProvider"),
  SocketServer: Symbol.for("SocketServer"),
  WebSocketServer: Symbol.for("WebSocketServer"),
  WebSocketCommand: Symbol.for("WebSocketCommand"),
  WebSocketBroadcaster: Symbol.for("WebSocketBroadcaster"),

  RedisClient: Symbol.for("RedisClient"),
  PresenceService: Symbol.for("PresenceService"),

  EventDispatcher: Symbol.for("EventDispatcher"),
  NotificationSubscriber: Symbol.for("NotificationSubscriber"),
};
