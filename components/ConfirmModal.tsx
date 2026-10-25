"use client"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-panel border-2 border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400">{message}</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={onCancel} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl font-bold transition">İptal</button>
                <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold transition">Onayla</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}