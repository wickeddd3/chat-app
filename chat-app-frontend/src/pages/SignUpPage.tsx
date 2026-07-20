import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { SignUpForm } from "@/features/auth/sign-up";

export default function SignUpPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center gap-2 self-center font-medium">
        <ChatCircleDotsIcon weight="fill" className="size-6 text-primary" />
        Chikamo
      </div>
      <SignUpForm />
    </div>
  );
}
