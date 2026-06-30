import { MessageCircleDashedIcon } from "lucide-react";
import { SignUpForm } from "@/features/auth/sign-up";

export default function SignUpPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center gap-2 self-center font-medium">
        <MessageCircleDashedIcon className="text-blue-500" />
        Chikamo
      </div>
      <SignUpForm />
    </div>
  );
}
