"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { fetchCrates, Crate, Skin } from "@/lib/csgo-api"
import { Coins, Gift, Sparkles, X, Package } from "lucide-react"
import CustomAlert from "@/components/CustomAlert"

export default function CaseClient({ currentUser }: { currentUser: any }) {
  const [balance, setBalance] = useState(currentUser.balance || 0)
  const [crates, setCrates] = useState<Crate[]>([])
  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [wonSkin, setWonSkin] = useState<Skin | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [reel, setReel] = useState<Skin[]>([])
  const [loading, setLoading] = useState(true)
  
  const [animationTarget, setAnimationTarget] = useState<string | number>(0)
  const [reelKey, setReelKey] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const cratesContainerRef = useRef<HTMLDivElement>(null)
  const winningSkinRef = useRef<Skin | null>(null)
  
  // KASA AÇMA SESİ İÇİN REF
  const openAudioRef = useRef<HTMLAudioElement | null>(null)

  const [alertState, setAlertState] = useState({ isOpen: false, message: "", type: "info" as "info" | "error" | "success" })
  const showAlert = (message: string, type: "info" | "error" | "success" = "info") => setAlertState({ isOpen: true, message, type })

  useEffect(() => {
    // Kasa açılma/kayma sesi (Tıkırtı/Whoosh efekti)
    openAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3")
    openAudioRef.current.volume = 0.6
    
    // Ses engelini aş
    const unlock = () => {
      if(openAudioRef.current) {
        openAudioRef.current.play().then(() => openAudioRef.current!.pause()).catch(()=>{})
      }
      document.removeEventListener('click', unlock)
    }
    document.addEventListener('click', unlock)

    fetchCrates().then(data => {
      setCrates(data)
      if (data.length > 0) setSelectedCrate(data[0])
      setLoading(false)
    }).catch(err => setLoading(false))

    return () => document.removeEventListener('click', unlock)
  }, [])

  const claimDaily = async () => {
    setIsClaiming(true)
    try {
      const res = await fetch("/api/case/daily", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.success) { setBalance(data.newBalance); showAlert("500 Kredi hesabına eklendi.", "success") } 
      else { showAlert(data.error || "Bir hata oluştu.", "error") }
    } catch (e) { showAlert("Sunucuya bağlanılamadı.", "error") }
    setIsClaiming(false)
  }

  const openCase = async () => {
    if (!selectedCrate || balance < 100) return showAlert("Yetersiz bakiye! Günlük ödülünü al.", "error")
    setIsOpening(true); setWonSkin(null); setAnimationTarget(0)

    // SESİ ÇAL
    if (openAudioRef.current) {
      openAudioRef.current.currentTime = 0;
      openAudioRef.current.play().catch(() => {});
    }

    try {
      const res = await fetch("/api/case/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crateId: selectedCrate.id }) })
      const text = await res.text()
      let data;
      try { data = JSON.parse(text) } catch (parseError) { showAlert("Sunucu hatası.", "error"); setIsOpening(false); return }

      if (!res.ok) { showAlert(data.error || "Kasa açılamadı.", "error"); setIsOpening(false); return }
      
      winningSkinRef.current = data.skin

      const pool = selectedCrate.contains || []
      const newReel = Array.from({ length: 60 }).map(() => pool[Math.floor(Math.random() * pool.length)])
      const winningIndex = 55
      newReel[winningIndex] = data.skin
      setReel(newReel); setBalance(data.newBalance)

      setTimeout(() => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.offsetWidth;
          const containerCenter = containerWidth / 2;
          const ITEM_WIDTH = 120;
          const GAP = 12; 
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
    }
  }

  const handleAnimationComplete = () => {
    if (isOpening && animationTarget !== 0) {
      setIsOpening(false)
      if (winningSkinRef.current) setWonSkin(winningSkinRef.current) 
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
          <div className="bg-black/50 border border-yellow-500/30 px-5 py-2 rounded-sm flex items-center gap-3">
            <Coins className="text-yellow-500" size={18} />
            <div className="text-lg font-black text-white">{balance} <span className="text-[10px] text-yellow-500 uppercase tracking-widest">KREDİ</span></div>
          </div>
          <button onClick={claimDaily} disabled={isClaiming} className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 px-5 py-2 rounded-sm text-xs font-bold flex items-center gap-2 transition uppercase tracking-widest disabled:opacity-50">
            <Gift size={16} /> GÜNLÜK ÖDÜL
          </button>
        </div>
      </div>

      <div className="w-full mb-6 relative group">
        <div ref={cratesContainerRef} className="flex gap-3 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
          <div className="flex flex-col items-center justify-center h-36">
            <button onClick={openCase} className="group relative bg-red-600/10 border border-red-500/30 p-1 rounded-md hover:bg-red-600/20 hover:scale-105 transition-all flex items-center gap-5 px-10 py-4 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              {selectedCrate && <img src={selectedCrate.image} alt={selectedCrate.name} className="w-14 h-14 group-hover:animate-bounce" />}
              <div className="flex flex-col items-start">
                <span className="text-lg font-black text-white uppercase tracking-widest">KASA AÇ <span className="text-red-500">(100 K)</span></span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{selectedCrate?.name}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {wonSkin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`bg-[#0a0f1c] border-2 p-8 rounded-md max-w-sm w-full relative shadow-[0_0_50px_rgba(0,0,0,1)] ${getRarityColor(wonSkin.rarity.name)}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"></div>
              <button onClick={() => setWonSkin(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
              <div className="text-center mt-4">
                <p className={`font-black uppercase tracking-[0.2em] text-[10px] mb-2 ${getRarityColor(wonSkin.rarity.name).split(" ")[0]}`}>GELEN EŞYA</p>
                <h2 className="text-2xl font-black mb-6 text-white tracking-widest">TEBRİKLER!</h2>
                <div className="bg-black/50 p-6 rounded-sm mb-6 border border-white/5 relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img src={wonSkin.image} alt={wonSkin.name} className="w-full h-32 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">{wonSkin.name}</h3>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-6">{wonSkin.weapon?.name}</p>
                <button onClick={() => setWonSkin(null)} className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-sm text-sm font-black uppercase tracking-widest transition-colors">ENVANTERE EKLE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}