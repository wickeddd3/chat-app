import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { Button } from "@/shared/ui/shadcn/button";
import { FaTriangleExclamation } from "react-icons/fa6";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const isChunkLoadError =
    error instanceof Error &&
    /error loading dynamically imported module|failed to fetch dynamically imported module/i.test(
      error.message,
    );

  const status = isRouteErrorResponse(error) ? error.status : undefined;

  const title = isChunkLoadError
    ? "New version available"
    : status === 404
      ? "Page not found"
      : "Something went wrong";

  const description = isChunkLoadError
    ? "This app was updated since you last loaded it. Reload to get the latest version."
    : status === 404
      ? "The page you're looking for doesn't exist."
      : "An unexpected error occurred. You can try reloading or going back home.";

  return (
    <div className="w-full h-full min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
      <FaTriangleExclamation className="text-muted-foreground" size={40} />
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      <div className="flex gap-2">
        {isChunkLoadError ? (
          <Button onClick={() => window.location.reload()}>Reload</Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go back
            </Button>
            <Button onClick={() => navigate("/")}>Go home</Button>
          </>
        )}
      </div>
    </div>
  );
}
