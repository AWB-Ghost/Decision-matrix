import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Info } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'info';
  action?: { label: string; onClick: () => void };
  duration: number;
}
const Ctx = createContext<(t: Omit<ToastItem, 'id' | 'duration' | 'tone'> & { tone?: ToastItem['tone']; duration?: number }) => void>(() => {});

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((t: Omit<ToastItem, 'id' | 'duration' | 'tone'> & { tone?: ToastItem['tone']; duration?: number }) => {
    setToast({ id: Date.now(), tone: 'success', duration: t.action ? 7000 : 2600, ...t });
  }, []);
  useEffect(() => {
    if (!toast) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), toast.duration);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-[80] flex justify-center px-4"
      >
        {toast && (
          <div key={toast.id} className="anim-fade-up pointer-events-auto flex max-w-[420px] items-center gap-3 rounded-[14px] bg-ink px-4 py-3 text-[14px] font-medium text-white shadow-[0_10px_30px_rgba(20,30,50,0.25)]">
            {toast.tone === 'success' ? <Check size={16} strokeWidth={2.2} aria-hidden /> : <Info size={16} aria-hidden />}
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="-my-1 ml-1 min-h-[36px] rounded-lg px-2 font-semibold text-[#9db8ff] hover:bg-white/10"
                onClick={() => {
                  toast.action!.onClick();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
