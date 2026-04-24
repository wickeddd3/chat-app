import { createBrowserRouter } from "react-router";
import { AuthGuard } from "./AuthGuard";
import { GuestGuard } from "./GuestGuard";
import { AuthLayout } from "../layouts/auth-layout";

export const router = createBrowserRouter([
  // --- PROTECTED ROUTES ---
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await import("@/pages/HomePage");
          return { Component: module.default };
        },
      },
      {
        path: "profile",
        lazy: async () => {
          const module = await import("@/pages/ProfilePage");
          return { Component: module.default };
        },
      },
      {
        path: "messages",
        lazy: async () => {
          const module = await import("@/pages/MessagesPage");
          return { Component: module.default };
        },
      },
    ],
  },

  // --- PUBLIC/AUTH ROUTES ---
  {
    path: "/auth",
    element: <GuestGuard />,
    children: [
      {
        path: "",
        element: <AuthLayout />,
        children: [
          {
            path: "sign-in",
            lazy: async () => {
              const module = await import("@/pages/SignInPage");
              return { Component: module.default };
            },
          },
          {
            path: "sign-up",
            lazy: async () => {
              const module = await import("@/pages/SignUpPage");
              return { Component: module.default };
            },
          },
        ],
      },
    ],
  },

  // --- 404/Catch-all ---
  {
    path: "*",
    element: (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <h1>404 | Page Not Found</h1>
      </div>
    ),
  },
]);
