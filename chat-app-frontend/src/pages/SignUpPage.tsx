import { FaCommentDots } from "react-icons/fa6";
import { SignUpForm } from "@/features/auth/sign-up";

export default function SignUpPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center gap-2 self-center font-medium">
        <FaCommentDots className="size-6 text-primary" />
        Chikamo
      </div>
      <SignUpForm />
    </div>
  );
}
