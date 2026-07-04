import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/shadcn/alert";
import { FaCircleInfo } from "react-icons/fa6";

export function HelpAlert() {
  return (
    <>
      <Alert className="max-w-md border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-50">
        <FaCircleInfo />
        <AlertTitle className="text-xs">Demo credentials</AlertTitle>
        <AlertDescription className="text-xs">
          <p className="text-pretty">
            If you're hesitant to signup you can use these credentials for demo
            purposes.
          </p>
          <ul className="list-disc md:list-inside">
            <li>loraine_rolfson@example.com - password123</li>
            <li>hank.johns80@example.com - password123</li>
          </ul>
        </AlertDescription>
      </Alert>
    </>
  );
}
