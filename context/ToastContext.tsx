import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-right-full duration-300
              ${toast.type === 'success' ? 'bg-white/95 border-green-200 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-white/95 border-red-200 text-red-800' : ''}
              ${toast.type === 'info' ? 'bg-white/95 border-blue-200 text-blue-800' : ''}
              ${toast.type === 'warning' ? 'bg-white/95 border-orange-200 text-orange-800' : ''}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold">{
                 toast.type === 'success' ? 'สำเร็จ!' : 
                 toast.type === 'error' ? 'เกิดข้อผิดพลาด' : 
                 toast.type === 'warning' ? 'แจ้งเตือน' : 'ข้อมูล'
              }</p>
              <p className="text-sm mt-0.5 opacity-90">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};