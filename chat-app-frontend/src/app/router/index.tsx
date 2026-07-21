import { createBrowserRouter, redirect } from "react-router";
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
            loader: () => redirect("/messages"),
          },
          {
            path: "profile",
            handle: { title: "Account" },
            lazy: async () => {
              const module = await import("@/pages/ProfilePage");
              return { Component: module.default };
            },
          },
          {
            path: "settings",
            handle: { title: "Settings" },
            lazy: async () => {
              const module = await import("@/pages/SettingsPage");
              return { Component: module.default };
            },
          },
          {
            path: "messages",
            handle: { title: "Messages" },
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
            handle: { title: "People" },
            lazy: async () => {
              const module = await import("@/pages/UserListPage");
              return { Component: module.default };
            },
          },
          {
            path: "contacts",
            handle: { title: "Contacts" },
            lazy: async () => {
              const module = await import("@/pages/ConnectionsPage");
              return { Component: module.default };
            },
          },
          {
            path: "contact-requests",
            handle: { title: "Connection requests" },
            lazy: async () => {
              const module = await import("@/pages/ConnectionRequestsPage");
              return { Component: module.default };
            },
          },
          {
            path: "notifications",
            handle: { title: "Notifications" },
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
            handle: { title: "Sign in" },
            lazy: async () => {
              const module = await import("@/pages/SignInPage");
              return { Component: module.default };
            },
          },
          {
            path: "sign-up",
            handle: { title: "Create an account" },
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
    handle: { title: "Page not found" },
    lazy: async () => {
      const module = await import("@/pages/NotFoundPage");
      return { Component: module.default };
    },
  },
]);
