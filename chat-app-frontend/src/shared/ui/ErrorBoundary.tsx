import { Component, type ReactNode } from "react";
import { Button } from "@/shared/ui/shadcn/button";
import { TriangleAlertIcon } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
          <TriangleAlertIcon className="text-muted-foreground" size={40} />
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              The app ran into an unexpected error. Reloading usually fixes
              this.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
