import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { SignInForm } from "@/features/auth/sign-in";
import { HelpAlert } from "@/widgets/help-alert";

export default function SignInPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center gap-2 self-center font-medium">
        <ChatCircleDotsIcon weight="fill" className="size-6 text-primary" />
        Chikamo
      </div>
      <SignInForm />
      <HelpAlert />
    </div>
  );
}
