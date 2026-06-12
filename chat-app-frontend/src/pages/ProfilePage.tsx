import { Card } from "@/shared/ui/shadcn/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { useAuthProfile } from "@/entities/auth";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { ProfileForm } from "@/features/auth/update-profile";
import { EmailForm } from "@/features/auth/update-email";
import { PasswordForm } from "@/features/auth/update-password";
import { UploadAvatar } from "@/features/auth/upload-avatar";
import { useAuth } from "@/app/store/AuthContext";

export default function ProfilePage() {
  const { authProfile, isLoading } = useAuthProfile();
  const { authUser } = useAuth();

  if (isLoading) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="h-full w-full flex justify-center items-center p-4">
      <div className="h-full max-w-2xl w-2xl flex flex-col gap-8 rounded-lg p-4">
        {/* Profile Header */}
        <div className="bg-gray-100 rounded-lg flex justify-between items-center px-4 py-6">
          <div className="flex items-center gap-4">
            <ProfileAvatar imageSrc={authProfile?.image || ""} />
            <div className="flex flex-col">
              <h1 className="text-md font-medium">{authProfile?.name}</h1>
              <h6 className="text-sm">{`@${authProfile?.username}`}</h6>
            </div>
          </div>
          {authProfile?.id && <UploadAvatar userId={authProfile?.id} />}
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
