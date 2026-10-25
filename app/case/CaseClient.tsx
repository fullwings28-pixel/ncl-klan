"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { fetchCrates, Crate, Skin } from "@/lib/csgo-api"
import { Gift, Sparkles, X, Package } from "lucide-react"
import CustomAlert from "@/components/CustomAlert"
import { CASE_PRICE } from "@/lib/economy"

export default function CaseClient({ currentUser }: { currentUser: any }) {
  const [balance, setBalance] = useState(currentUser.balance || 0)
  const [crates, setCrates] = useState<Crate[]>([])
  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isOpening, setIsOpening] = useState(false)
  
  // KAZANILANLARI ANİMASYON BİTENE KADAR TUTACAĞIMIZ STATE
  const [wonSkins, setWonSkins] = useState<any[] | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [reel, setReel] = useState<Skin[]>([])
  const [loading, setLoading] = useState(true)
  
  const [animationTarget, setAnimationTarget] = useState<string | number>(0)
  const [reelKey, setReelKey] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<any[] | null>(null) 
  
  const tickAudioRef = useRef<HTMLAudioElement | null>(null)
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false)

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

    fetchCrates().then(data => { setCrates(data); if (data.length > 0) setSelectedCrate(data[0]); setLoading(false) })
    
    return () => {
      document.removeEventListener('click', unlockAudio)
      if (tickTimerRef.current) clearTimeout(tickTimerRef.current)
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

  const claimDaily = async () => {
    setIsClaiming(true)
    try {
      const res = await fetch("/api/case/daily", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.success) { setBalance(data.newBalance); showAlert("Günlük ödül hesabına eklendi.", "success") } 
      else { showAlert(data.error || "Bir hata oluştu.", "error") }
    } catch (e) { showAlert("Sunucuya bağlanılamadı.", "error") }
    setIsClaiming(false)
  }

  const openCase = async () => {
    const cost = CASE_PRICE * quantity;
    if (!selectedCrate || Number(balance) < cost) return showAlert(`Yetersiz bakiye! ${quantity} kasa için $${cost.toFixed(2)} gerekli.`, "error")
    
    setIsOpening(true); 
    setWonSkins(null); 
    setAnimationTarget(0)
    playTickSequence(4500);

    try {
      const res = await fetch("/api/case/open", { 
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ crateId: selectedCrate.id, quantity: Number(quantity) }) // Sayı olarak zorluyoruz
      })
      const data = await res.json()

      if (!res.ok) { showAlert(data.error || "Kasa açılamadı.", "error"); setIsOpening(false); return }
      
      // Veriyi hafızaya al
      resultRef.current = data.skins;

      const pool = selectedCrate.contains || []
      const newReel = Array.from({ length: 60 }).map(() => pool[Math.floor(Math.random() * pool.length)])
      
      const winningIndex = 55
      
      // EĞER 5'Lİ AÇILDIYSA, 5 SKİNİ DE ŞERİDİN FARKLI YERLERİNE KOY (Görsel şölen)
      if (data.skins.length > 0) newReel[winningIndex] = data.skins[0];
      if (data.skins.length > 1) newReel[winningIndex - 5] = data.skins[1];
      if (data.skins.length > 2) newReel[winningIndex - 10] = data.skins[2];
      if (data.skins.length > 3) newReel[winningIndex - 15] = data.skins[3];
      if (data.skins.length > 4) newReel[winningIndex - 20] = data.skins[4];

      setReel(newReel); 
      setBalance(data.newBalance)

      setTimeout(() => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.offsetWidth;
          const containerCenter = containerWidth / 2;
          const ITEM_WIDTH = 120; const GAP = 12; 
          const totalItemWidth = ITEM_WIDTH + GAP;
          const itemCenterX = (winningIndex * totalItemWidth) + (ITEM_WIDTH / 2);
          const randomOffset = (Math.random() - 0.5) * (ITEM_WIDTH - 40); 
          setAnimationTarget(`${containerCenter - itemCenterX + randomOffset}px`)
          setReelKey(prev => prev + 1)
        }
      }, 50)

    } catch (error) {
      showAlert("Sunucuya bağlanılamadı.", "error")
      setIsOpening(false)
      if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
    }
  }

  const handleAnimationComplete = () => {
    if (isOpening && animationTarget !== 0) {
      setIsOpening(false)
      if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
      
      // Animasyon bitince sonuçları göster
      if (resultRef.current) {
        setWonSkins(resultRef.current);
      }
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
          <button onClick={claimDaily} disabled={isClaiming} className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 px-5 py-2 rounded-sm text-xs font-bold flex items-center gap-2 transition uppercase tracking-widest disabled:opacity-50">
            <Gift size={16} /> GÜNLÜK ÖDÜL
          </button>
        </div>
      </div>

      <div className="w-full mb-6 relative group">
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
          {crates.map((crate) => (
            <button key={crate.id} onClick={() => !isOpening && setSelectedCrate(crate)}
              className={`flex-shrink-0 w-32 p-3 rounded-sm border transition-all duration-300 ${selectedCrate?.id === crate.id ? "border-red-500/50 bg-red-500/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]" : "border-white/5 bg-[#0a0f1c]/50 hover:border-white/20 hover:bg-white/5"} ${isOpening ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <img src={crate.image} alt={crate.name} className={`w-full h-16 object-contain mb-2 transition-transform duration-300 ${selectedCrate?.id === crate.id ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'opacity-70 group-hover:opacity-100'}`} />
              <div className="text-[10px] font-bold text-zinc-300 text-center truncate w-full uppercase tracking-wider">{crate.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="w-full relative py-12 overflow-hidden bg-[#050811] border border-white/10 rounded-md shadow-2xl">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500 z-20 -translate-x-1/2 shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {isOpening ? (
          <motion.div key={reelKey} className="flex gap-3" initial={{ x: 0 }} animate={{ x: animationTarget }} transition={{ duration: 4.5, ease: [0.1, 0.9, 0.2, 1] }} onAnimationComplete={handleAnimationComplete}>
            {reel.map((skin, i) => (
              <div key={i} className={`flex-shrink-0 w-[120px] h-36 bg-[#0a0f1c] border-2 rounded-sm p-2 flex flex-col items-center justify-between ${getRarityColor(skin.rarity.name)}`}>
                <img src={skin.image} alt={skin.name} className="w-full h-20 object-contain drop-shadow-xl" />
                <div className="text-center w-full bg-black/40 p-1 rounded-sm border-t border-white/5">
                  <div className="text-[8px] text-zinc-500 uppercase tracking-widest">{skin.weapon?.name}</div>
                  <div className="text-[10px] font-bold text-white truncate w-full">{skin.name}</div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-36 gap-4">
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-sm border border-white/10">
              {[1, 3, 5].map(q => (
                <button key={q} onClick={() => setQuantity(q)} className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-colors ${quantity === q ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                  {q}x AÇ
                </button>
              ))}
            </div>

            <button onClick={openCase} className="group relative bg-red-600/10 border border-red-500/30 p-1 rounded-md hover:bg-red-600/20 hover:scale-105 transition-all flex items-center gap-5 px-10 py-4 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              {selectedCrate && <img src={selectedCrate.image} alt={selectedCrate.name} className="w-14 h-14 group-hover:animate-bounce" />}
              <div className="flex flex-col items-start">
                <span className="text-lg font-black text-white uppercase tracking-widest">KASA AÇ <span className="text-green-500">(${(CASE_PRICE * quantity).toFixed(2)})</span></span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{selectedCrate?.name} (x{quantity})</span>
              </div>
            </button>
          </div>
        )}
      </div>

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
                  <div key={idx} className={`flex flex-col items-center p-3 rounded-sm border-2 bg-black/50 ${getRarityColor(skin.rarity.name)}`}>
                    <img src={skin.image} alt={skin.name} className="w-full h-20 object-contain drop-shadow-xl mb-3" />
                    <h3 className="text-[11px] font-bold text-white text-center w-full truncate">{skin.name}</h3>
                    <div className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wider">{skin.wear}</div>
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