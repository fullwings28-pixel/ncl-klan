"use client"
import { createContext, useContext, useState, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "info"
interface ToastState { id: number; message: string; type: ToastType }

const ToastContext = createContext<any>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500) // 3.5 saniye sonra kaybolur
  }

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
                toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                toast.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              }`}
            >
              {toast.type === "success" && <CheckCircle2 size={20} />}
              {toast.type === "error" && <XCircle size={20} />}
              {toast.type === "info" && <Info size={20} />}
              
              <span className="text-sm font-semibold text-white">{toast.message}</span>
              
              <button onClick={() => removeToast(toast.id)} className="ml-2 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)