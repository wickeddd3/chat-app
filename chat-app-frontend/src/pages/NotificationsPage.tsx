import { NotificationList } from "@/features/notification/notification-list";
import { useReadNotification } from "@/features/notification/mark-as-read";

export default function NotificationsPage() {
  const { readNotification } = useReadNotification();

  return (
    <div className="flex-1 flex flex-col max-h-full border-r">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-base font-medium text-foreground">Notifications</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden ">
        <NotificationList onClick={readNotification} />
      </div>
    </div>
  );
}
