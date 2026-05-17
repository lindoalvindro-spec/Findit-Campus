import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const ICONS = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const STYLES = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/80',
    border: 'border-emerald-400/60',
    icon: 'text-emerald-500',
    title: 'text-emerald-800 dark:text-emerald-200',
    text: 'text-emerald-700 dark:text-emerald-300',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/80',
    border: 'border-red-400/60',
    icon: 'text-red-500',
    title: 'text-red-800 dark:text-red-200',
    text: 'text-red-700 dark:text-red-300',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/80',
    border: 'border-amber-400/60',
    icon: 'text-amber-500',
    title: 'text-amber-800 dark:text-amber-200',
    text: 'text-amber-700 dark:text-amber-300',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/80',
    border: 'border-blue-400/60',
    icon: 'text-blue-500',
    title: 'text-blue-800 dark:text-blue-200',
    text: 'text-blue-700 dark:text-blue-300',
    progress: 'bg-blue-500',
  },
};

const Toast = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const style = STYLES[toast.type] || STYLES.info;
  const icon = ICONS[toast.type] || ICONS.info;
  const duration = toast.duration || 4000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 30);

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 400);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast.id, duration, onDismiss]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 400);
  };

  return (
    <div
      className={`
        relative overflow-hidden w-[380px] max-w-[90vw] rounded-xl border shadow-lg backdrop-blur-sm
        ${style.bg} ${style.border}
        ${isExiting ? 'animate-toast-exit' : 'animate-toast-enter'}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={`material-symbols-outlined text-[24px] flex-shrink-0 mt-0.5 ${style.icon}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <div className="flex-grow min-w-0">
          {toast.title && (
            <p className={`font-semibold text-sm mb-0.5 ${style.title}`}>
              {toast.title}
            </p>
          )}
          <p className={`text-sm leading-relaxed ${style.text}`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-0.5 rounded-full hover:bg-black/10 transition-colors ${style.text}`}
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-[3px] w-full bg-black/5">
        <div
          className={`h-full ${style.progress} transition-none rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', title = null, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title, duration }]);
  }, []);

  const toast = {
    success: (message, title = 'Berhasil!') => showToast(message, 'success', title),
    error: (message, title = 'Terjadi Kesalahan') => showToast(message, 'error', title),
    warning: (message, title = 'Peringatan') => showToast(message, 'warning', title, 5000),
    info: (message, title = null) => showToast(message, 'info', title),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
