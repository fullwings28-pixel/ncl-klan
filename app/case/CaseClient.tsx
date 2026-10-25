"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { fetchCrates, Crate, Skin } from "@/lib/csgo-api"
import { supabase } from "@/lib/supabaseClient"
import { Gift, Sparkles, X, Package } from "lucide-react"
import CustomAlert from "@/components/CustomAlert"
import { CASE_PRICE } from "@/lib/economy"

export default function CaseClient({ currentUser }: { currentUser: any }) {
  const [balance, setBalance] = useState(currentUser.balance || 0)
  const [crates, setCrates] = useState<any[]>([])
  const [selectedCrate, setSelectedCrate] = useState<any | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isOpening, setIsOpening] = useState(false)
  
  const [wonSkins, setWonSkins] = useState<any[] | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  
  const [reels, setReels] = useState<{ id: number, items: any[], target: string, duration: number }[]>([])
  const [reelKey, setReelKey] = useState(0)
  
  const resultRef = useRef<any[] | null>(null) 
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const tickAudioRef = useRef<HTMLAudioElement | null>(null)
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false)

  const [loading, setLoading] = useState(true)

  const [alertState, setAlertState] = useState({ isOpen: false, message: "", type: "info" as "info" | "error" | "success" })
  const showAlert = (message: string, type: "info" | "error" | "success" = "info") => setAlertState({ isOpen: true, message, type })

  useEffect(() => {
    tickAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3")
    tickAudioRef.current.volume = 0.4
    
    const unlockAudio = () => {
      if (!isAudioUnlocked && tickAudioRef.current) {
        tickAudioRef.current.play().then(() => {
          tickAudioRef.current!.pause(); tickAudioRef.current!.currentTime = 0; setIsAudioUnlocked(true)
        }).catch(() => {})
      }
      document.removeEventListener('click', unlockAudio)
      document.removeEventListener('touchstart', unlockAudio)
    }

    document.addEventListener('click', unlockAudio)
    document.addEventListener('touchstart', unlockAudio)

    const fetchAllCases = async () => {
      const apiCrates = await fetchCrates()
      const { data: customData } = await supabase.from("custom_cases").select("*")
      const formattedCustom = (customData || []).map(c => ({
        id: c.id,
        name: c.name,
        image: c.image_url,
        isCustom: true,
        customPrice: Number(c.price),
        contains: []
      }))

      const allCrates = [...formattedCustom, ...apiCrates]
      setCrates(allCrates)
      if (allCrates.length > 0) setSelectedCrate(allCrates[0])
      setLoading(false)
    }

    fetchAllCases()
    
    return () => {
      document.removeEventListener('click', unlockAudio)
      if (tickTimerRef.current) clearTimeout(tickTimerRef.current)
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current)
    }
  }, [isAudioUnlocked])

  const playTickSequence = (durationMs: number) => {
    let elapsed = 0; let delay = 40;
    const tick = () => {
      if (elapsed >= durationMs) return;
      if (tickAudioRef.current) { tickAudioRef.current.currentTime = 0; tickAudioRef.current.play().catch(() => {}); }
      elapsed += delay;
      const progress = elapsed / durationMs; 
      delay = 40 + (progress * progress) * 350;
      tickTimerRef.current = setTimeout(tick, delay);
    };
    tick();
  }

  const openCase = async () => {
    const cost = selectedCrate?.isCustom ? (selectedCrate.customPrice * quantity) : (CASE_PRICE * quantity);
    if (!selectedCrate || Number(balance) < cost) return showAlert(`Yetersiz bakiye! ${quantity} kasa için $${cost.toFixed(2)} gerekli.`, "error")
    
    setIsOpening(true); 
    setWonSkins(null); 
    setReels([]); 
    
    const durations = [4.5, 4.8, 5.1, 5.4, 5.7];
    const maxDuration = durations[quantity - 1] || 5.7;
    
    playTickSequence(maxDuration * 1000);

    try {
      const res = await fetch("/api/case/open", { 
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ crateId: selectedCrate.id, quantity: Number(quantity) })
      })
      const data = await res.json()

      if (!res.ok) { showAlert(data.error || "Kasa açılamadı.", "error"); setIsOpening(false); return }
      
      resultRef.current = data.skins;

      const newReels = [];
      for (let q = 0; q < quantity; q++) {
        const pool = selectedCrate.isCustom ? [data.skins[q]] : (selectedCrate.contains || [])
        
        const reelItems = Array.from({ length: 60 }).map(() => {
          if (selectedCrate.isCustom) {
             const tempPool = [data.skins[q], ...(selectedCrate.contains || [])];
             return tempPool[Math.floor(Math.random() * tempPool.length)] || data.skins[q];
          }
          return pool[Math.floor(Math.random() * pool.length)];
        });
        
        if (data.skins[q]) {
            reelItems[55] = data.skins[q];
        }
        
        newReels.push({
            id: q,
            items: reelItems,
            duration: durations[q] || 5.7,
            target: "0px"
        });
      }
      
      setReels(newReels); 
      setBalance(data.newBalance)

      setTimeout(() => {
        const targets = rowRefs.current.map(ref => {
            if (!ref) return "0px";
            const containerCenter = ref.offsetWidth / 2;
            const winningIndex = 55;
            const ITEM_WIDTH = 140; const GAP = 12; 
            const totalItemWidth = ITEM_WIDTH + GAP;
            const itemCenterX = (winningIndex * totalItemWidth) + (ITEM_WIDTH / 2);
            const randomOffset = (Math.random() - 0.5) * (ITEM_WIDTH - 40); 
            return `${containerCenter - itemCenterX + randomOffset}px`;
        });

        setReels(prev => prev.map((reel, i) => ({ ...reel, target: targets[i] || "0px" })));
        setReelKey(prev => prev + 1);
      }, 100)

      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      finishTimerRef.current = setTimeout(() => {
        setIsOpening(false);
        if (resultRef.current) {
          setWonSkins(resultRef.current);
        }
        if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
      }, (maxDuration * 1000) + 200);

    } catch (error) {
      showAlert("Sunucuya bağlanılamadı.", "error")
      setIsOpening(false)
      if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
    }
  }

  const getRarityColor = (rarityName: string) => {
    switch (rarityName) {
      case "Rare Special": return "text-yellow-400 border-yellow-400 bg-yellow-500/10 shadow-[0_0_10px_rgba(250,204,21,0.2)]"
      case "Covert": return "text-red-500 border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
      case "Classified": return "text-pink-500 border-pink-500 bg-pink-500/10 shadow-[0_0_10px_rgba(236,72,153,0.2)]"
      case "Restricted": return "text-purple-500 border-purple-500 bg-purple-500/10"
      case "Mil-Spec Grade": return "text-blue-400 border-blue-400 bg-blue-500/10"
      default: return "text-gray-400 border-gray-400 bg-gray-500/10"
    }
  }

  if (loading) return <div className="text-white text-center py-20 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Package className="animate-spin" size={18}/> Kasalar Yükleniyor...</div>

  return (
    <div className="flex flex-col items-center">
      <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))} />

      <div className="w-full flex flex-col md:flex-row justify-between items-center hud-panel p-5 rounded-md mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-widest uppercase">
            <Sparkles className="text-yellow-500" size={24}/> LOOT TERMİNALİ
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="bg-black/50 border border-green-500/30 px-5 py-2 rounded-sm flex items-center gap-3">
            <span className="text-green-500 font-black text-xl">$</span>
            <div className="text-lg font-black text-white">{Number(balance).toFixed(2)} <span className="text-[10px] text-green-500 uppercase tracking-widest">BAKİYE</span></div>
          </div>
          <button onClick={() => {}} disabled={isClaiming} className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 px-5 py-2 rounded-sm text-xs font-bold flex items-center gap-2 transition uppercase tracking-widest disabled:opacity-50">
            <Gift size={16} /> GÜNLÜK ÖDÜL
          </button>
        </div>
      </div>

      <div className="w-full mb-6 relative group">
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
          {crates.map((crate) => (
            <button key={crate.id} onClick={() => !isOpening && setSelectedCrate(crate)}
              className={`flex-shrink-0 w-32 p-3 rounded-sm border transition-all duration-300 relative ${selectedCrate?.id === crate.id ? "border-red-500/50 bg-red-500/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]" : "border-white/5 bg-[#0a0f1c]/50 hover:border-white/20 hover:bg-white/5"} ${isOpening ? 'opacity-50 cursor-not-allowed' : ''}`}>
              
              {crate.isCustom && (
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm border border-purple-400 z-10">ÖZEL</div>
              )}

              <img src={crate.image} alt={crate.name} className={`w-full h-16 object-contain mb-2 transition-transform duration-300 ${selectedCrate?.id === crate.id ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'opacity-70 group-hover:opacity-100'}`} />
              <div className="text-[10px] font-bold text-zinc-300 text-center truncate w-full uppercase tracking-wider">{crate.name}</div>
            </button>
          ))}
        </div>
      </div>

      {isOpening ? (
        <div className="flex flex-col gap-3 w-full">
            {reels.map((reel, index) => (
                <div key={index} className="w-full relative overflow-hidden bg-[#050811] border border-white/10 rounded-md py-4">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500 z-20 -translate-x-1/2 shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                    <motion.div 
                        key={`${reelKey}-${index}`} 
                        className="flex gap-3" 
                        initial={{ x: 0 }} 
                        animate={{ x: reel.target }} 
                        transition={{ duration: reel.duration, ease: [0.1, 0.9, 0.2, 1] }} 
                        ref={(el) => { rowRefs.current[index] = el }}
                    >
                        {reel.items.map((skin, i) => (
                            <div key={i} className={`flex-shrink-0 w-[140px] h-40 bg-[#0a0f1c] border-2 rounded-sm p-3 flex flex-col items-center justify-between ${getRarityColor(skin.rarity.name)}`}>
                                <img src={skin.image} alt={skin.name} className="w-full h-24 object-contain drop-shadow-xl" />
                                <div className="text-center w-full bg-black/40 p-1.5 rounded-sm border-t border-white/5">
                                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest">{skin.weapon?.name || "WEAPON"}</div>
                                    <div className="text-[11px] font-bold text-white truncate w-full">{skin.name}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            ))}
        </div>
      ) : (
        <div className="w-full relative py-12 overflow-hidden bg-[#050811] border border-white/10 rounded-md shadow-2xl">
            <div className="flex flex-col items-center justify-center h-40 gap-6">
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-sm border border-white/10">
                {[1, 3, 5].map(q => (
                    <button key={q} onClick={() => setQuantity(q)} className={`px-6 py-2 text-sm font-bold rounded-sm transition-colors ${quantity === q ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                    {q}x AÇ
                    </button>
                ))}
                </div>

                <button onClick={openCase} className="group relative bg-red-600/10 border border-red-500/30 p-2 rounded-md hover:bg-red-600/20 hover:scale-105 transition-all flex items-center gap-6 px-12 py-5 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                {selectedCrate && <img src={selectedCrate.image} alt={selectedCrate.name} className="w-16 h-16 group-hover:animate-bounce" />}
                <div className="flex flex-col items-start">
                    <span className="text-xl font-black text-white uppercase tracking-widest">
                      KASA AÇ <span className="text-green-500">(${((selectedCrate?.isCustom ? selectedCrate.customPrice : CASE_PRICE) * quantity).toFixed(2)})</span>
                    </span>
                    <span className="text-xs text-zinc-400 uppercase tracking-wider">{selectedCrate?.name} (x{quantity})</span>
                </div>
                </button>
            </div>
        </div>
      )}

      <AnimatePresence>
        {!isOpening && wonSkins && wonSkins.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0f1c] border-2 border-white/10 p-6 rounded-md max-w-5xl w-full relative shadow-[0_0_50px_rgba(0,0,0,1)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
              <button onClick={() => setWonSkins(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white tracking-widest">KAZANILANLAR (x{wonSkins.length})</h2>
              </div>

              <div className={`grid gap-4 ${wonSkins.length === 1 ? 'grid-cols-1' : wonSkins.length === 3 ? 'grid-cols-3' : 'grid-cols-5'}`}>
                {wonSkins.map((skin, idx) => (
                  <div key={idx} className={`flex flex-col items-center p-4 rounded-sm border-2 bg-black/50 ${getRarityColor(skin.rarity.name)}`}>
                    <img src={skin.image} alt={skin.name} className="w-full h-24 object-contain drop-shadow-xl mb-3" />
                    <h3 className="text-xs font-bold text-white text-center w-full truncate">{skin.name}</h3>
                    <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">{skin.wear}</div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5">Float: {skin.float}</div>
                    <div className="text-sm font-black text-green-400 mt-2">${skin.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => setWonSkins(null)} className="w-full mt-8 bg-white text-black hover:bg-zinc-200 py-3 rounded-sm text-sm font-black uppercase tracking-widest transition-colors">ENVANTERE EKLE</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}