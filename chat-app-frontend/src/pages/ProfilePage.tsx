import { Card } from "@/shared/ui/shadcn/card";
import { Tabs, TabsContent } from "@/shared/ui/shadcn/tabs";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/shared/ui/SegmentedTabs";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { ProfileForm } from "@/features/auth/update-profile";
import { EmailForm } from "@/features/auth/update-email";
import { PasswordForm } from "@/features/auth/update-password";
import { UploadAvatar } from "@/features/auth/upload-avatar";
import { useAuth, useAuthProfile, ProfilePageSkeleton } from "@/entities/auth";

/** Each tab says what it covers, so the panel is not three unlabelled forms. */
const SECTIONS = {
  profile: {
    title: "Profile details",
    description: "Your name and username, as other people see them.",
  },
  email: {
    title: "Email address",
    description: "Used to sign in. Changing it needs confirmation.",
  },
  password: {
    title: "Password",
    description: "Choose something you don't use anywhere else.",
  },
} as const;

export default function ProfilePage() {
  const { authUser } = useAuth();
  const { authProfile, isLoading } = useAuthProfile(authUser?.id);

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    // `items-start` rather than centring: a centred tall column gets clipped at
    // the top once a panel grows past the viewport height.
    <div className="h-full w-full flex justify-center items-start overflow-y-auto p-4 md:p-8 scrollbar-thin">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, sign-in email and password.
          </p>
        </header>

        <Card className="flex-row items-center justify-between gap-4 rounded-2xl px-5 py-5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <ProfileAvatar imageSrc={authProfile?.image || ""} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate font-medium text-foreground">
                {authProfile?.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                @{authProfile?.username}
              </p>
            </div>
          </div>
          {authProfile?.id && <UploadAvatar userId={authProfile.id} />}
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <SegmentedTabsList className="w-full">
            <SegmentedTabsTrigger value="profile" className="flex-1">
              Profile
            </SegmentedTabsTrigger>
            <SegmentedTabsTrigger value="email" className="flex-1">
              Email
            </SegmentedTabsTrigger>
            <SegmentedTabsTrigger value="password" className="flex-1">
              Password
            </SegmentedTabsTrigger>
          </SegmentedTabsList>

          <TabsContent value="profile">
            <SectionCard section={SECTIONS.profile}>
              <ProfileForm
                name={authProfile?.name || ""}
                username={authProfile?.username || ""}
              />
            </SectionCard>
          </TabsContent>
          <TabsContent value="email">
            <SectionCard section={SECTIONS.email}>
              <EmailForm email={authUser?.email || ""} />
            </SectionCard>
          </TabsContent>
          <TabsContent value="password">
            <SectionCard section={SECTIONS.password}>
              <PasswordForm />
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  children,
}: {
  section: { title: string; description: string };
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-4 gap-5 rounded-2xl px-5 py-6 md:px-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium text-foreground">{section.title}</h2>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </div>
      <hr className="border-border/60" />
      {children}
    </Card>
  );
}
