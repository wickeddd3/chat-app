import { AvatarWithBadge } from "@/entities/message";
import { CameraIcon } from "lucide-react";
import { Card } from "@/shared/ui/shadcn/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { ProfileForm } from "@/features/auth/update-profile";
import { EmailForm } from "@/features/auth/update-email";
import { PasswordForm } from "@/features/auth/update-password";
import { authClient } from "@/shared/lib/better-auth.client";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="h-full w-full flex justify-center items-center p-4">
      <div className="h-full max-w-2xl w-2xl flex flex-col gap-8 rounded-lg p-4">
        {/* Profile Header */}
        <div className="bg-gray-100 rounded-lg flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            <AvatarWithBadge />
            <div className="flex flex-col">
              <h1 className="text-md font-medium">{session?.user?.name}</h1>
              <h6 className="text-sm">{`@${session?.user?.username}`}</h6>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center">
            <button className="p-2 rounded-full cursor-pointer hover:bg-gray-200">
              <CameraIcon size={22} className="text-blue-500" />
            </button>
            <span className="text-xs text-gray-500">Upload avatar</span>
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="text-xl font-semibold">Update Profile</h2>
          <p>Manage profile details and password</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="profile" className="cursor-pointer">
              Profile
            </TabsTrigger>
            <TabsTrigger value="email" className="cursor-pointer">
              Email
            </TabsTrigger>
            <TabsTrigger value="password" className="cursor-pointer">
              Password
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card className="py-10 px-6">
              <ProfileForm
                name={session?.user?.name || ""}
                username={session?.user?.username || ""}
              />
            </Card>
          </TabsContent>
          <TabsContent value="email">
            <Card className="py-10 px-6">
              <EmailForm email={session?.user?.email || ""} />
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <Card className="py-10 px-6">
              <PasswordForm />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
