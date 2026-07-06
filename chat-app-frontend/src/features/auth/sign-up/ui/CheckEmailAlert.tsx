import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/shared/ui/shadcn/alert";
import { FaEnvelope, FaXmark } from "react-icons/fa6";

export interface CheckEmailAlertProps {
  email: string;
  onDismiss?: () => void;
}

/**
 * Transient post-signup notice telling the user to confirm their email before
 * they can sign in. Rendered by SignUpForm on a successful registration and
 * auto-dismissed there after a short delay.
 */
export function CheckEmailAlert({ email, onDismiss }: CheckEmailAlertProps) {
  return (
    <Alert
      role="status"
      className="border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-50"
    >
      <FaEnvelope />
      <AlertTitle className="text-xs">Confirm your email</AlertTitle>
      <AlertDescription className="text-xs text-cyan-900/90 dark:text-cyan-50/90">
        <p className="text-pretty">
          We sent a confirmation link to <strong>{email}</strong>. Check your
          inbox (and spam folder) to activate your account before signing in.
        </p>
      </AlertDescription>
      {onDismiss && (
        <AlertAction>
          <button
            type="button"
            aria-label="Dismiss"
            title="Dismiss"
            onClick={onDismiss}
            className="cursor-pointer rounded p-1 text-current/70 hover:text-current"
          >
            <FaXmark size={14} />
          </button>
        </AlertAction>
      )}
    </Alert>
  );
}
