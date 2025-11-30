import { createContext, useContext, useEffect, useRef, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const show = (message, type = 'info', duration = 3000) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
  };

  const value = { show };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded shadow-soft text-sm border transition transform duration-300 ${
            t.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
            t.type === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
            'bg-brandAmber/15 text-amber-800 border-amber-200'
          }`}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}