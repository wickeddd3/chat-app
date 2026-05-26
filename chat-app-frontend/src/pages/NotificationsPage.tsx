import { NotificationList } from "@/features/notification/notification-list";

export default function NotificationsPage() {
  return (
    <div className="flex-1 flex flex-col max-h-full border-r">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-base font-medium text-foreground">Notifications</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden ">
        <NotificationList />
      </div>
    </div>
  );
}
