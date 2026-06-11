import { useAuth } from "../store/AuthContext";
import { Navigate, Outlet } from "react-router";

export const AuthGuard = () => {
  const { authUser, authUserLoading } = useAuth();

  if (authUserLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return <Outlet />;
};
