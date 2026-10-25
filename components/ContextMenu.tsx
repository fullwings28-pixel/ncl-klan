"use client"
import { useEffect, useRef } from "react"
import { Copy, Flag, Trash2 } from "lucide-react"
import { motion } from "framer-motion"

interface ContextMenuProps {
  x: number
  y: number
  isMe: boolean
  isAdmin: boolean
  onClose: () => void
  onCopy: () => void
  onReport: () => void
  onDelete: () => void
}

export default function ContextMenu({ x, y, isMe, isAdmin, onClose, onCopy, onReport, onDelete }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Dışarı tıklanınca menüyü kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-[1000] w-48 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl rounded-xl overflow-hidden py-1"
    >
      <button 
        onClick={() => { onCopy(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        <Copy size={16} /> Metni Kopyala
      </button>

      {!isMe && (
        <button 
          onClick={() => { onReport(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-yellow-500 hover:text-yellow-400 hover:bg-zinc-800 transition-colors"
        >
          <Flag size={16} /> Şikayet Et
        </button>
      )}

      {isAdmin && !isMe && (
        <>
          <div className="h-px w-full bg-zinc-800 my-1" />
          <button 
            onClick={() => { onDelete(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          >
            <Trash2 size={16} /> Mesajı Sil
          </button>
        </>
      )}
    </motion.div>
  )
}