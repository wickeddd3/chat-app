import { FaCommentDots } from "react-icons/fa6";
import { SignInForm } from "@/features/auth/sign-in";
import { HelpAlert } from "@/widgets/help-alert";

export default function SignInPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center gap-2 self-center font-medium">
        <FaCommentDots className="size-6 text-blue-500" />
        Chikamo
      </div>
      <SignInForm />
      <HelpAlert />
    </div>
  );
}
