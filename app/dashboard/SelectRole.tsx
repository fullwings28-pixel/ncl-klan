"use client"
import { useState } from "react"
import { Shield, Target, Crosshair, Zap, Eye, Crosshair as CrosshairIcon } from "lucide-react"
import { useToast } from "@/components/Toast"

const ROLES = [
  { id: "AWPer", icon: Target, color: "text-blue-400", desc: "Keskin nişancı" },
  { id: "Entry Fragger", icon: Zap, color: "text-red-400", desc: "İlk giren" },
  { id: "IGL", icon: Shield, color: "text-yellow-400", desc: "Takım Lideri" },
  { id: "Support", icon: Crosshair, color: "text-green-400", desc: "Destek" },
  { id: "Lurker", icon: Eye, color: "text-purple-400", desc: "Sinsi" },
  { id: "Rifler", icon: CrosshairIcon, color: "text-zinc-400", desc: "Tüfekçi" },
]

export default function SelectRole({ initialRole }: { initialRole: string }) {
  const [selectedRole, setSelectedRole] = useState(initialRole || "Belirtilmemiş")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleSave = async (roleId: string) => {
    setSelectedRole(roleId)
    setLoading(true)
    
    const res = await fetch("/api/profile/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: roleId })
    })

    if (res.ok) {
      showToast("Taktiksel rolün güncellendi!", "success")
    } else {
      showToast("Rol güncellenemedi.", "error")
    }
    setLoading(false)
  }

  return (
    <div className="mt-6 border-t border-zinc-800/60 pt-6">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Target size={16} /> Taktiksel Rolün
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ROLES.map((r) => {
          const Icon = r.icon
          const isSelected = selectedRole === r.id
          return (
            <button
              key={r.id}
              onClick={() => !loading && handleSave(r.id)}
              disabled={loading}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                isSelected 
                  ? "bg-zinc-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.02]" 
                  : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <Icon size={24} className={`${r.color} mb-2`} />
              <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{r.id}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5">{r.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}