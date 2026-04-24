import { GalleryVerticalEnd } from "lucide-react";
import { SignUpForm } from "@/features/auth/sign-up";

export default function SignUpPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <a href="#" className="flex items-center gap-2 self-center font-medium">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GalleryVerticalEnd className="size-4" />
        </div>
        Chat App
      </a>
      <SignUpForm />
    </div>
  );
}
