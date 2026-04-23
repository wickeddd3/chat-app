import { authClient } from "@/shared/lib/better-auth.client";
import { Navigate, Outlet } from "react-router";

export const AuthGuard = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return <Outlet />;
};
