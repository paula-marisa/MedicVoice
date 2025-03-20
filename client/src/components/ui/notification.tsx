import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number;
}

export interface NotificationRef {
  show: (props: NotificationProps) => void;
}

export const Notification = forwardRef<NotificationRef, {}>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const show = useCallback(({ message, type = "info", duration = 3000 }: NotificationProps) => {
    setMessage(message);
    setType(type);
    setVisible(true);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    const id = window.setTimeout(() => {
      hide();
    }, duration);

    setTimeoutId(id);
  }, [hide, timeoutId]);

  useImperativeHandle(ref, () => ({
    show
  }), [show]);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  if (!visible) return null;

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  };

  const bgColors = {
    success: "bg-green-50 dark:bg-green-900/20",
    error: "bg-red-50 dark:bg-red-900/20",
    warning: "bg-amber-50 dark:bg-amber-900/20",
    info: "bg-blue-50 dark:bg-blue-900/20"
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
      <div
        className={cn(
          "px-4 py-3 rounded-lg shadow-lg flex items-center",
          "border dark:border-neutral-700",
          bgColors[type]
        )}
      >
        <div className="mr-3">{icons[type]}</div>
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{message}</span>
      </div>
    </div>
  );
});

Notification.displayName = "Notification";
