import { useAuth } from "@/entities/auth";
import { Navigate, Outlet } from "react-router";

export const GuestGuard = () => {
  const { authUser, authUserLoading } = useAuth();

  if (authUserLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  if (authUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
