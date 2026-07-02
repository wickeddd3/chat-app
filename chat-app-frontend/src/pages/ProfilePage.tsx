import { Card } from "@/shared/ui/shadcn/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { ProfileForm } from "@/features/auth/update-profile";
import { EmailForm } from "@/features/auth/update-email";
import { PasswordForm } from "@/features/auth/update-password";
import { UploadAvatar } from "@/features/auth/upload-avatar";
import { useAuth, useAuthProfile, ProfilePageSkeleton } from "@/entities/auth";

export default function ProfilePage() {
  const { authUser } = useAuth();
  const { authProfile, isLoading } = useAuthProfile(authUser?.id);

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="h-full w-full flex justify-center items-center p-4 overflow-auto">
      <div className="h-full max-w-2xl w-full md:w-2xl flex flex-col gap-8 rounded-lg">
        {/* Profile Header */}
        <div className="bg-gray-100 rounded-lg flex justify-between items-center gap-4 px-4 py-6">
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <ProfileAvatar imageSrc={authProfile?.image || ""} />
            <div className="flex-1 flex flex-col min-w-0">
              <h1 className="text-md font-medium truncate">
                {authProfile?.name}
              </h1>
              <h6 className="text-sm truncate">{`@${authProfile?.username}`}</h6>
            </div>
          </div>
          {authProfile?.id && <UploadAvatar userId={authProfile?.id} />}
        </div>

        <div className="flex flex-col">
          <h2 className="text-md md:text-lg font-semibold text-gray-800">
            Update Profile
          </h2>
          <p className="text-sm md:text-md font-light text-gray-800">
            Manage profile details and password
          </p>
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
                name={authProfile?.name || ""}
                username={authProfile?.username || ""}
              />
            </Card>
          </TabsContent>
          <TabsContent value="email">
            <Card className="py-10 px-6">
              <EmailForm email={authUser?.email || ""} />
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
