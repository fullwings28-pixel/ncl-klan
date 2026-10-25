"use client"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, CheckCircle, Info, X } from "lucide-react"

type AlertType = "info" | "error" | "success"

interface CustomAlertProps {
  isOpen: boolean
  message: string
  type?: AlertType
  onClose: () => void
}

export default function CustomAlert({ isOpen, message, type = "info", onClose }: CustomAlertProps) {
  if (!isOpen) return null

  // Türe göre renk ve ikon belirleme
  const getStyle = () => {
    switch (type) {
      case "success":
        return { icon: <CheckCircle size={28} className="text-green-400" />, color: "border-green-500/50 shadow-green-500/20" }
      case "error":
        return { icon: <AlertCircle size={28} className="text-red-400" />, color: "border-red-500/50 shadow-red-500/20" }
      default:
        return { icon: <Info size={28} className="text-cyan-400" />, color: "border-cyan-500/50 shadow-cyan-500/20" }
    }
  }

  const style = getStyle()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`glass-panel border-2 p-6 rounded-2xl max-w-sm w-full relative shadow-2xl ${style.color}`}
            onClick={(e) => e.stopPropagation()} // İçeri tıklayınca kapanmasın
          >
            <button onClick={onClose} className="absolute top-3 right-3 text-zinc-400 hover:text-white transition">
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-zinc-950/50 rounded-full border border-zinc-800">
                {style.icon}
              </div>
              
              <p className="text-white font-medium text-[15px] leading-relaxed">
                {message}
              </p>

              <button 
                onClick={onClose} 
                className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl font-bold transition"
              >
                Tamam
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}