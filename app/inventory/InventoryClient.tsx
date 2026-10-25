"use client"
import { useEffect, useState } from "react"
import { Coins, Package, ArrowRight, DollarSign, Trash2, Lock, Unlock } from "lucide-react"
import { useToast } from "@/components/Toast"
import ConfirmModal from "@/components/ConfirmModal"

export default function InventoryClient({ currentUser }: { currentUser: any }) {
  const [items, setItems] = useState<any[]>([])
  const [balance, setBalance] = useState(currentUser.balance || 0)
  const [loading, setLoading] = useState(true)
  const [isSellingAll, setIsSellingAll] = useState(false)
  const { showToast } = useToast()
  
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean, item: any, type: "single" | "all" }>({ isOpen: false, item: null, type: "single" })

  const fetchItems = async () => {
    const res = await fetch("/api/inventory")
    const data = await res.json()
    if (res.ok) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  // Kilit açma/kapatma
  const handleToggleLock = async (item: any) => {
    const newLockState = !item.is_locked
    // UI'ı anında güncelle (Optimistic UI)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_locked: newLockState } : i))

    const res = await fetch("/api/inventory/toggle-lock", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId: item.id, isLocked: newLockState })
    })

    if (res.ok) {
      showToast(newLockState ? "Eşya kilitlendi." : "Eşyanın kilidi açıldı.", "success")
    } else {
      showToast("Kilit durumu değiştirilemedi.", "error")
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_locked: item.is_locked } : i)) // Hata olursa geri al
    }
  }

  const handleSellClick = (item: any) => {
    if (item.is_locked) return showToast("Kilitli eşyalar satılamaz.", "error")
    setConfirmState({ isOpen: true, item, type: "single" })
  }
  
  const handleSellAllClick = () => {
    const unlockedItems = items.filter(i => !i.is_locked)
    if (unlockedItems.length === 0) return showToast("Satılacak kilitli olmayan eşya yok.", "error")
    setConfirmState({ isOpen: true, item: null, type: "all" })
  }

  const confirmSell = async () => {
    if (confirmState.type === "single") {
      if (!confirmState.item) return
      const { id, price, skin_name } = confirmState.item

      const res = await fetch("/api/inventory/sell", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inventoryId: id, price }) })
      const data = await res.json()
      
      if (res.ok) {
        setBalance(data.newBalance)
        setItems(prev => prev.filter(item => item.id !== id))
        showToast(`"${skin_name}" başarıyla satıldı! +$${Number(price).toFixed(2)}`, "success")
      } else showToast(data.error || "Satış başarısız.", "error")
    } 
    else if (confirmState.type === "all") {
      setIsSellingAll(true)
      const res = await fetch("/api/inventory/sell-all", { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        setBalance(data.newBalance)
        // Sadece kilitli olmayanları uçur
        setItems(prev => prev.filter(item => item.is_locked)) 
        showToast(`Tüm satılabilir eşyalar satıldı! +$${Number(data.totalPrice).toFixed(2)}`, "success")
      } else {
        showToast(data.error || "Satış başarısız.", "error")
      }
      setIsSellingAll(false)
    }
    
    setConfirmState({ isOpen: false, item: null, type: "single" })
  }

  const getRarityStyle = (rarity: string, isLocked: boolean) => {
    if (isLocked) return "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] bg-yellow-500/5" // Kilitliyse altın sarısı parlama
    switch (rarity) {
      case "Rare Special": return "border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.15)] bg-yellow-500/5"
      case "Covert": return "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-500/5"
      case "Classified": return "border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)] bg-pink-500/5"
      case "Restricted": return "border-purple-500/50 bg-purple-500/5"
      case "Mil-Spec Grade": return "border-blue-400/50 bg-blue-500/5"
      default: return "border-zinc-700 bg-zinc-800/20"
    }
  }

  // Sadece kilitli olmayanların toplamını hesapla
  const totalValue = items.filter(i => !i.is_locked).reduce((acc, item) => acc + Number(item.price), 0)
  const unlockedCount = items.filter(i => !i.is_locked).length

  if (loading) return <div className="text-zinc-400 text-center py-20 text-sm uppercase tracking-widest animate-pulse">Cephanelik Yükleniyor...</div>

  return (
    <div className="flex flex-col items-center">
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.type === "all" ? "Tüm Envanteri Sat" : "Eşyayı Sat"}
        message={
          confirmState.type === "all" 
            ? `Envanterindeki kilitli OLMAYAN ${unlockedCount} eşyayı toplam $${totalValue.toFixed(2)} karşılığında satmak istediğine emin misin? (Kilitli eşyalar korunacak)`
            : confirmState.item ? `"${confirmState.item.skin_name}" eşyasını $${Number(confirmState.item.price).toFixed(2)} karşılığında satmak istediğine emin misin?` : ""
        }
        onConfirm={confirmSell}
        onCancel={() => setConfirmState({ isOpen: false, item: null, type: "single" })}
      />

      <div className="w-full flex flex-col md:flex-row justify-between items-center hud-panel p-6 rounded-md mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-widest uppercase">
            <Package className="text-red-500" size={28}/> Cephanelik
          </h1>
          <p className="text-zinc-400 text-xs mt-1 tracking-wider uppercase">Eşyalarını kilitleyerek güvende tut.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {unlockedCount > 0 && (
            <button 
              onClick={handleSellAllClick} 
              disabled={isSellingAll}
              className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 px-5 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Trash2 size={18} /> TÜMÜNÜ SAT (${totalValue.toFixed(2)})
            </button>
          )}
          
          <div className="bg-black/50 border border-green-500/30 px-5 py-3 rounded-sm flex items-center gap-4 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <DollarSign className="text-green-500" size={24} />
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Bakiyen</div>
              <div className="text-xl font-black text-white">${Number(balance).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 w-full hud-panel rounded-md border-dashed">
          <Package size={64} className="mb-4 opacity-10" />
          <p className="text-sm uppercase tracking-widest font-bold">Cephanelik Boş.</p>
          <a href="/case" className="mt-6 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 px-6 py-2.5 rounded-sm text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-widest">
            Kasa Açmaya Git <ArrowRight size={14} />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 w-full">
          {items.map((item) => (
            <div key={item.id} className={`rounded-md border p-3 flex flex-col items-center relative group transition-all duration-300 hover:-translate-y-1 ${getRarityStyle(item.skin_rarity, item.is_locked)}`}>
              
              {/* KİLİT BUTONU (Sağ Üst Köşe) */}
              <button 
                onClick={() => handleToggleLock(item)}
                className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-md transition-all z-10 ${item.is_locked ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-black/50 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-white'}`}
                title={item.is_locked ? "Kilidi Aç" : "Kilitle"}
              >
                {item.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>

              <img src={item.skin_image} alt={item.skin_name} className={`w-full h-16 object-contain mb-2 drop-shadow-2xl transition-transform duration-300 ${item.is_locked ? 'opacity-80' : 'group-hover:scale-110'}`} />
              
              <div className="text-center w-full mb-2">
                <div className="text-[8px] text-zinc-500 uppercase tracking-widest mb-0.5">{item.skin_rarity}</div>
                <div className="text-[11px] font-bold text-white truncate w-full tracking-wide" title={item.skin_name}>{item.skin_name}</div>
                {item.wear && <div className="text-[9px] text-zinc-400 mt-0.5">{item.wear}</div>}
                {item.float_value && <div className="text-[8px] text-zinc-600 font-mono">F: {Number(item.float_value).toFixed(5)}</div>}
              </div>

              {/* SAT BUTONU (Kilitliyse devre dışı veya farklı görünür) */}
              <button 
                onClick={() => handleSellClick(item)} 
                disabled={item.is_locked}
                className={`w-full py-1.5 rounded-sm text-[10px] font-bold transition-all flex items-center justify-center gap-1 border uppercase tracking-widest ${
                  item.is_locked 
                    ? 'bg-yellow-500/10 text-yellow-500/50 border-yellow-500/10 cursor-not-allowed' 
                    : 'bg-black/40 hover:bg-green-600/20 text-zinc-400 hover:text-green-400 border-white/5 hover:border-green-500/30'
                }`}
              >
                {item.is_locked ? <><Lock size={10} /> KİLİTLİ</> : <><Coins size={12} /> ${Number(item.price).toFixed(2)} SAT</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}