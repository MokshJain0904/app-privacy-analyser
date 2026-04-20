'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const Toast: React.FC<{
  toast: ToastMessage;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const bgColor =
    toast.type === 'success'
      ? 'bg-green-50 border-green-200'
      : toast.type === 'error'
        ? 'bg-red-50 border-red-200'
        : toast.type === 'warning'
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-blue-50 border-blue-200';

  const iconColor =
    toast.type === 'success'
      ? 'text-green-600'
      : toast.type === 'error'
        ? 'text-red-600'
        : toast.type === 'warning'
          ? 'text-yellow-600'
          : 'text-blue-600';

  const textColor =
    toast.type === 'success'
      ? 'text-green-800'
      : toast.type === 'error'
        ? 'text-red-800'
        : toast.type === 'warning'
          ? 'text-yellow-800'
          : 'text-blue-800';

  const Icon =
    toast.type === 'success'
      ? CheckCircle
      : toast.type === 'error'
        ? AlertCircle
        : toast.type === 'warning'
          ? AlertCircle
          : Info;

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg shadow-lg animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto ${bgColor}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className={`text-sm font-medium flex-1 ${textColor}`}>{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className={`flex-shrink-0 ${iconColor} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
