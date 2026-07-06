import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({
  message,
  isVisible,
  onDismiss,
  duration = 2000,
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
