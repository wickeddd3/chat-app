import { useAuth } from "@/entities/auth";
import { Navigate, Outlet } from "react-router";

export const AuthGuard = () => {
  const { authSession, isAuthPending } = useAuth();

  if (isAuthPending) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  if (!authSession) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return <Outlet />;
};
