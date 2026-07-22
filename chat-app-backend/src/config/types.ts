export const TYPES = {
  PrismaClient: Symbol.for("PrismaClient"),
  /** Supabase client (auth identity provider), injected rather than imported. */
  SupabaseClient: Symbol.for("SupabaseClient"),
  /** Unit of Work: lets a service span one transaction across repositories. */
  TransactionManager: Symbol.for("TransactionManager"),

  AuthRouter: Symbol.for("AuthRouter"),
  AuthController: Symbol.for("AuthController"),
  AuthService: Symbol.for("AuthService"),
  AuthRepository: Symbol.for("AuthRepository"),

  UsersRouter: Symbol.for("UsersRouter"),
  UsersController: Symbol.for("UsersController"),
  UsersService: Symbol.for("UsersService"),
  UsersQuery: Symbol.for("UsersQuery"), // reads (user table); the module has no writes

  ChannelsRouter: Symbol.for("ChannelsRouter"),
  ChannelsController: Symbol.for("ChannelsController"),
  ChannelsService: Symbol.for("ChannelsService"),
  ChannelsRepository: Symbol.for("ChannelsRepository"), // channel table writes
  ChannelsQuery: Symbol.for("ChannelsQuery"), // inbox/list reads
  ChannelMembersRepository: Symbol.for("ChannelMembersRepository"), // channel_member table

  MessagesRouter: Symbol.for("MessagesRouter"),
  MessagesController: Symbol.for("MessagesController"),
  MessagesService: Symbol.for("MessagesService"),
  MessagesRepository: Symbol.for("MessagesRepository"), // writes
  MessagesQuery: Symbol.for("MessagesQuery"), // reads
  // Read receipts are part of the message aggregate (a child table of message).
  MessageReceiptsRepository: Symbol.for("MessageReceiptsRepository"),

  ConnectionsRouter: Symbol.for("ConnectionsRouter"),
  ConnectionsController: Symbol.for("ConnectionsController"),
  ConnectionsService: Symbol.for("ConnectionsService"),
  ConnectionsRepository: Symbol.for("ConnectionsRepository"), // writes
  ConnectionsQuery: Symbol.for("ConnectionsQuery"), // reads

  NotificationsRouter: Symbol.for("NotificationsRouter"),
  NotificationsController: Symbol.for("NotificationsController"),
  NotificationsService: Symbol.for("NotificationsService"),
  NotificationsRepository: Symbol.for("NotificationsRepository"), // writes
  NotificationsQuery: Symbol.for("NotificationsQuery"), // reads (feed + unread count)

  PresenceRouter: Symbol.for("PresenceRouter"),
  PresenceController: Symbol.for("PresenceController"),

  StatsRouter: Symbol.for("StatsRouter"),
  StatsController: Symbol.for("StatsController"),

  SocketServerProvider: Symbol.for("SocketServerProvider"),
  SocketServer: Symbol.for("SocketServer"),
  WebSocketServer: Symbol.for("WebSocketServer"),
  WebSocketCommand: Symbol.for("WebSocketCommand"),

  BroadcasterService: Symbol.for("BroadcasterService"),

  RedisMainClient: Symbol.for("RedisMainClient"), // For regular DB cache operations & presence tracking
  RedisPubClient: Symbol.for("RedisPubClient"), // Specifically for pushing data to the MessagePack bus
  RedisSubClient: Symbol.for("RedisSubClient"), // reserved exclusively for Socket.io internal horizontal syncing
  PresenceService: Symbol.for("PresenceService"),
  PresencePruneWorker: Symbol.for("PresencePruneWorker"),

  EventDispatcher: Symbol.for("EventDispatcher"),
  NotificationSubscriber: Symbol.for("NotificationSubscriber"),
  RequestSubscriber: Symbol.for("RequestSubscriber"),
};
