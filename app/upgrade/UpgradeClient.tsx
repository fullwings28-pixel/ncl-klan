"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { fetchSkins, Skin } from "@/lib/csgo-api"
import { getWear, getFloatMultiplier, getSkinMultiplier, RARITY_BASE_PRICES } from "@/lib/economy"
import { ArrowUpRight, RefreshCw, X, Package } from "lucide-react"
import { useToast } from "@/components/Toast"
import { motion, AnimatePresence } from "framer-motion"

export default function UpgradeClient({ currentUser }: { currentUser: any }) {
  const [inventory, setInventory] = useState<any[]>([])
  const [selectedSource, setSelectedSource] = useState<any>(null)
  const [targetItem, setTargetItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [result, setResult] = useState<{ won: boolean, item: any } | null>(null)
  
  const [skinsPool, setSkinsPool] = useState<Skin[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      const { data: invData } = await supabase.from("inventories").select("*").eq("user_id", currentUser.id).order("price", { ascending: false })
      if (invData) setInventory(invData)

      const allSkins = await fetchSkins()
      setSkinsPool(allSkins)
      
      setLoading(false)
    }
    fetchData()
  }, [currentUser.id])

  const rollTargetSkin = () => {
    if (!selectedSource) return showToast("Önce yükseltmek için bir eşya seç.", "error")
    
    const sourcePrice = Number(selectedSource.price)
    const minTargetPrice = sourcePrice * 1.5
    const maxTargetPrice = sourcePrice * 20

    const eligibleSkins = skinsPool.filter(skin => {
      const basePrice = RARITY_BASE_PRICES[skin.rarity.name] || 1
      const multiplier = getSkinMultiplier(skin.name)
      const estimatedPrice = basePrice * multiplier
      return estimatedPrice >= minTargetPrice && estimatedPrice <= maxTargetPrice
    })

    if (eligibleSkins.length === 0) return showToast("Uygun fiyatta hedef bulunamadı, farklı bir eşya seç.", "error")

    const randomSkin = eligibleSkins[Math.floor(Math.random() * eligibleSkins.length)]
    
    const floatVal = Number((Math.random()).toFixed(8))
    const wear = getWear(floatVal)
    const basePrice = RARITY_BASE_PRICES[randomSkin.rarity.name] || 1
    const finalPrice = Number((basePrice * getFloatMultiplier(floatVal) * getSkinMultiplier(randomSkin.name)).toFixed(2))

    setTargetItem({ ...randomSkin, float: floatVal, wear, price: finalPrice })
  }

  const handleUpgrade = async () => {
    if (!selectedSource || !targetItem) return showToast("Eşya ve hedef seçmelisin.", "error")
    
    setIsUpgrading(true)
    setResult(null)

    setTimeout(async () => {
      const res = await fetch("/api/upgrade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId: selectedSource.id, targetItem })
      })
      const data = await res.json()

      if (res.ok) {
        if (data.won) {
          setResult({ won: true, item: targetItem })
          showToast(`MÜKEMMEL! ${targetItem.name} kazandın!`, "success")
          setInventory(prev => prev.filter(i => i.id !== selectedSource.id)) 
        } else {
          setResult({ won: false, item: targetItem })
          showToast(`Kaybettin... ${selectedSource.skin_name} gitti.`, "error")
          setInventory(prev => prev.filter(i => i.id !== selectedSource.id)) 
        }
        setSelectedSource(null)
        setTargetItem(null)
      } else {
        showToast(data.error || "Yükseltme başarısız.", "error")
      }
      setIsUpgrading(false)
    }, 2500) 
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Rare Special": return "border-yellow-400 bg-yellow-500/10"
      case "Covert": return "border-red-500 bg-red-500/10"
      case "Classified": return "border-pink-500 bg-pink-500/10"
      case "Restricted": return "border-purple-500 bg-purple-500/10"
      case "Mil-Spec Grade": return "border-blue-400 bg-blue-500/10"
      default: return "border-gray-500 bg-gray-500/10"
    }
  }

  const winChance = selectedSource && targetItem 
    ? Math.min(90, Math.max(2, (Number(selectedSource.price) / Number(targetItem.price)) * 100))
    : 0

  if (loading) return <div className="text-zinc-500 text-center py-20 animate-pulse uppercase tracking-widest">Sistem Yükleniyor...</div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3 tracking-widest uppercase text-glow">
          <ArrowUpRight className="text-green-500" size={36} /> UPGRADE (YÜKSELTME)
        </h1>
        <p className="text-zinc-400 mt-2 text-xs uppercase tracking-widest">Eşyanı riske at, daha değerlisini kazan!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-[#0a0f1c] p-8 rounded-xl border border-white/5 shadow-2xl relative">
        
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Yükseltilecek Eşya</h2>
          
          <div className={`h-48 rounded-lg border-2 border-dashed flex items-center justify-center relative p-4 transition-all duration-300 ${selectedSource ? getRarityColor(selectedSource.skin_rarity) : 'border-white/10 bg-black/40'}`}>
            {selectedSource ? (
              <div className="text-center w-full">
                <img src={selectedSource.skin_image} alt={selectedSource.skin_name} className="w-full h-24 object-contain mb-2" />
                <div className="text-[10px] text-zinc-400 truncate">{selectedSource.skin_name}</div>
                <div className="text-lg font-black text-green-400">${Number(selectedSource.price).toFixed(2)}</div>
                <button onClick={() => setSelectedSource(null)} className="absolute top-2 right-2 bg-black/50 text-red-500 p-1 rounded"><X size={14}/></button>
              </div>
            ) : (
              <div className="text-zinc-600 text-xs uppercase tracking-widest flex flex-col items-center gap-2">
                <Package size={32} className="opacity-20" />
                Envanterden Seç
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar h-24">
            {inventory.map(item => (
              <div key={item.id} onClick={() => setSelectedSource(item)} className={`flex-shrink-0 w-20 bg-black/40 border rounded cursor-pointer hover:border-green-500/50 transition p-1 flex flex-col items-center ${selectedSource?.id === item.id ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-white/10'}`}>
                <img src={item.skin_image} className="w-full h-12 object-contain" />
                <span className="text-[9px] font-bold text-green-500 mt-1">${Number(item.price).toFixed(2)}</span>
              </div>
            ))}
            {inventory.length === 0 && <div className="text-xs text-zinc-500 w-full text-center mt-8">Envanter boş.</div>}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center relative">
          <div className="relative w-40 h-40 rounded-full border-4 border-white/5 flex items-center justify-center mb-6 bg-black/50">
            {isUpgrading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="text-zinc-500">
                <RefreshCw size={48} />
              </motion.div>
            ) : (
              <>
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="46%" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                  <circle cx="50%" cy="50%" r="46%" stroke="#22c55e" strokeWidth="8" fill="transparent" 
                    strokeDasharray={`${winChance * 2.89} 289`} 
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="text-center z-10">
                  <div className="text-3xl font-black text-white">{winChance.toFixed(1)}%</div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Kazanma Şansı</div>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={handleUpgrade}
            disabled={isUpgrading || !selectedSource || !targetItem}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-4 rounded-md font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:shadow-none"
          >
            {isUpgrading ? "YÜKSELTİLİYOR..." : "YÜKSELT"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center">Hedef Eşya</h2>
          
          <div className={`h-48 rounded-lg border-2 border-dashed flex items-center justify-center relative p-4 transition-all duration-300 ${targetItem ? getRarityColor(targetItem.rarity.name) : 'border-white/10 bg-black/40'}`}>
            {targetItem ? (
              <div className="text-center w-full">
                <img src={targetItem.image} alt={targetItem.name} className="w-full h-24 object-contain mb-2" />
                <div className="text-[10px] text-zinc-400 truncate">{targetItem.name}</div>
                <div className="text-lg font-black text-green-400">${Number(targetItem.price).toFixed(2)}</div>
                <button onClick={() => setTargetItem(null)} className="absolute top-2 right-2 bg-black/50 text-red-500 p-1 rounded"><X size={14}/></button>
              </div>
            ) : (
              <button onClick={rollTargetSkin} className="text-zinc-500 text-xs uppercase tracking-widest flex flex-col items-center gap-2 hover:text-white transition">
                <RefreshCw size={32} className="opacity-50" />
                Rastgele Hedef Bul
              </button>
            )}
          </div>
          <div className="text-center text-[10px] text-zinc-500 leading-relaxed px-4">
            Hedef eşya ne kadar pahalıysa, yükseltme şansın o kadar düşer. Maksimum %90 şans elde edebilirsin.
          </div>
        </div>

      </div>

      <AnimatePresence>
        {result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className={`bg-[#0a0f1c] border-2 p-8 rounded-xl max-w-md w-full text-center relative shadow-2xl ${result.won ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)]'}`}
            >
              <button onClick={() => setResult(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20}/></button>
              
              <h2 className={`text-3xl font-black uppercase tracking-widest mb-2 ${result.won ? 'text-green-500' : 'text-red-500'}`}>
                {result.won ? "KAZANDIN!" : "KAYBETTİN"}
              </h2>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-6">Yükseltme Sonucu</p>

              <div className={`p-6 rounded-lg border-2 mb-6 ${result.won ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5 grayscale'}`}>
                <img src={result.item.image} alt={result.item.name} className="w-full h-32 object-contain mb-4" />
                <h3 className="text-lg font-bold text-white">{result.item.name}</h3>
                <div className="text-sm font-black text-green-400 mt-2">${Number(result.item.price).toFixed(2)}</div>
              </div>

              <button onClick={() => setResult(null)} className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-md text-sm font-black uppercase tracking-widest transition">DEVAM ET</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}