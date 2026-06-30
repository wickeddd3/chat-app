import { MessageCircleDashedIcon } from "lucide-react";
import { SignInForm } from "@/features/auth/sign-in";
import { HelpAlert } from "@/widgets/help-alert";

export default function SignInPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center gap-2 self-center font-medium">
        <MessageCircleDashedIcon className="text-blue-500" />
        Chikamo
      </div>
      <SignInForm />
      <HelpAlert />
    </div>
  );
}
