"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "loading";
  onClose?: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info" | "loading";
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  onRemove: (id: string) => void;
}

// Глобальное хранилище для тостов
let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const addToast = (props: Omit<ToastProps, 'onClose'>) => {
    const id = `toast-${toastId++}`;
    const newToast = { ...props, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Автоматическое удаление
    if (props.type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, props.duration || 3000);
    }
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) =>
    addToast({ type: 'success', message, ...options });

  const error = (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) =>
    addToast({ type: 'error', message, ...options });

  const info = (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) =>
    addToast({ type: 'info', message, ...options });

  const loading = (message: string, options?: Partial<Omit<ToastProps, 'type' | 'message'>>) =>
    addToast({ type: 'loading', message, duration: 0, ...options }); // Не удалять автоматически

  return { success, error, info, loading, toasts, removeToast };
}

export function Toast({ message, type, onClose, duration, action }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (type === 'loading') return; // Не удалять loading тосты автоматически

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose || (() => {}), 300);
      }, 300);
    }, duration || 3000);

    return () => clearTimeout(timer);
  }, [duration, onClose, type]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500" />,
    loading: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
  };

  const backgrounds = {
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    loading: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300",
        isVisible && !isLeaving ? "opacity-100 translate-y-0 scale-100" : 
        isLeaving ? "opacity-0 translate-y-2 scale-95" : 
        "opacity-0 -translate-y-2 scale-95"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md",
          backgrounds[type]
        )}
      >
        {icons[type]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
            {message}
          </p>
          {action && (
            <button
              onClick={() => {
                action.onClick();
                if (type !== 'loading') {
                  setIsLeaving(true);
                  setTimeout(() => {
                    setIsVisible(false);
                    setTimeout(onClose || (() => {}), 300);
                  }, 300);
                }
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-1 underline"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => {
              setIsVisible(false);
              setTimeout(onClose || (() => {}), 300);
            }, 300);
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            action={toast.action}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Глобальный контейнер для тостов
export function GlobalToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
