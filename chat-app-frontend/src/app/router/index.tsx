import { createBrowserRouter } from "react-router";
import { AuthGuard } from "./AuthGuard";
import { GuestGuard } from "./GuestGuard";
import { AuthLayout } from "../layouts/auth-layout";
import { ChatLayout } from "../layouts/chat-layout";
import { ContentPlaceholder } from "@/features/message/chat-room";
import { RouteErrorBoundary } from "@/shared/ui/RouteErrorBoundary";

export const router = createBrowserRouter([
  // --- PROTECTED ROUTES ---
  {
    path: "/",
    element: <AuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "",
        element: <ChatLayout />,
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
            children: [
              {
                index: true,
                element: <ContentPlaceholder />,
              },
              {
                path: ":channelId",
                lazy: async () => {
                  const module = await import("@/pages/ChatRoomPage");
                  return { Component: module.default };
                },
              },
            ],
          },
          {
            path: "people",
            lazy: async () => {
              const module = await import("@/pages/UserListPage");
              return { Component: module.default };
            },
          },
          {
            path: "contacts",
            lazy: async () => {
              const module = await import("@/pages/ConnectionsPage");
              return { Component: module.default };
            },
          },
          {
            path: "contact-requests",
            lazy: async () => {
              const module = await import("@/pages/ConnectionRequestsPage");
              return { Component: module.default };
            },
          },
          {
            path: "notifications",
            lazy: async () => {
              const module = await import("@/pages/NotificationsPage");
              return { Component: module.default };
            },
          },
        ],
      },
    ],
  },

  // --- PUBLIC/AUTH ROUTES ---
  {
    path: "/auth",
    element: <GuestGuard />,
    errorElement: <RouteErrorBoundary />,
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
