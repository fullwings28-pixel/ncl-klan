"use client"
import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { ArrowRightLeft, Check, X, ShieldAlert, Package } from "lucide-react"
import { useToast } from "@/components/Toast"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function TradesClient({ currentUser }: { currentUser: any }) {
  const [trades, setTrades] = useState<any[]>([])
  const [myInventory, setMyInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Kabul etme modalı için state
  const [acceptModal, setAcceptModal] = useState<{ isOpen: boolean, trade: any, selectedItems: string[] }>({ isOpen: false, trade: null, selectedItems: [] })

  const { showToast } = useToast()

  const fetchData = async () => {
    const resTrades = await fetch("/api/trades")
    if (resTrades.ok) {
      const tData = await resTrades.json()
      setTrades(tData)
      
      // Tüm eşyaların detaylarını çekmek için envanterleri de çekelim
      const { data: invData } = await supabase.from("inventories").select("*")
      if (invData) setMyInventory(invData) // Not: İdeal olarak takas edilen eşyaların detaylarını API'den çekmek daha iyidir.
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAction = async (tradeId: string, action: string, items: string[] = []) => {
    const res = await fetch("/api/trades", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trade_id: tradeId, action, receiver_items: items })
    })
    const data = await res.json()

    if (res.ok) {
      showToast(`İşlem başarılı.`, "success")
      setAcceptModal({ isOpen: false, trade: null, selectedItems: [] })
      fetchData()
    } else {
      showToast(data.error, "error")
    }
  }

  const toggleSelectItem = (itemId: string) => {
    setAcceptModal(prev => {
      const exists = prev.selectedItems.includes(itemId)
      return {
        ...prev,
        selectedItems: exists ? prev.selectedItems.filter(id => id !== itemId) : [...prev.selectedItems, itemId]
      }
    })
  }

  if (loading) return <div className="text-center py-20 text-zinc-500 animate-pulse uppercase tracking-widest">Takaslar Yükleniyor...</div>

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3 tracking-widest uppercase">
          <ArrowRightLeft className="text-cyan-500" size={36} /> TAKAS MERKEZİ
        </h1>
        <p className="text-zinc-400 mt-2 text-xs uppercase tracking-widest">Envanterindeki eşyaları arkadaşlarınla değiş tokuş et.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {trades.map(trade => {
          const isReceiver = trade.receiver_id === currentUser.id
          const isSender = trade.sender_id === currentUser.id
          const otherUser = isSender ? trade.receiver : trade.sender
          
          // Eşya detaylarını bul (Basit bir eşleştirme)
          const senderItemsData = myInventory.filter(i => trade.sender_items.includes(i.id) || i.user_id === trade.sender_id && trade.sender_items.includes(i.id)) // Sadece kendi envanterinden çekebiliyoruz ama id eşleşiyorsa gösterelim
          
          return (
            <div key={trade.id} className={`hud-panel p-6 rounded-md border flex flex-col md:flex-row items-center justify-between gap-6 ${
              trade.status === 'pending' ? 'border-yellow-500/30' : 
              trade.status === 'accepted' ? 'border-green-500/30 opacity-75' : 'border-zinc-800'
            }`}>
              
              <div className="flex items-center gap-4">
                <img src={otherUser?.avatar_url} className="w-12 h-12 rounded-sm border border-white/10" />
                <div>
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{isSender ? 'Gönderdiğin Teklif' : 'Sana Gelen Teklif'}</div>
                  <div className={`text-lg font-bold uppercase tracking-wider ${isSender ? 'text-cyan-400' : 'text-yellow-400'}`}>{otherUser?.display_name}</div>
                  <div className="text-[10px] text-zinc-500">{new Date(trade.created_at).toLocaleString('tr-TR')}</div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Verilen Eşyalar</div>
                  <div className="flex -space-x-4">
                    {trade.sender_items.map((id: string) => {
                      const item = myInventory.find(i => i.id === id)
                      return item ? <img key={id} src={item.skin_image} className="w-12 h-12 rounded-sm bg-zinc-900 border border-white/10 relative z-10" /> : null
                    })}
                    {trade.sender_items.length === 0 && <span className="text-xs text-zinc-600">Eşya yok</span>}
                  </div>
                </div>
                
                <ArrowRightLeft className="text-zinc-600" size={24} />

                <div className="text-center">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">İstenen Eşyalar</div>
                  <div className="flex -space-x-4">
                    {trade.receiver_items.map((id: string) => {
                      const item = myInventory.find(i => i.id === id)
                      return item ? <img key={id} src={item.skin_image} className="w-12 h-12 rounded-sm bg-zinc-900 border border-white/10 relative z-10" /> : null
                    })}
                    {trade.receiver_items.length === 0 && <span className="text-xs text-zinc-600">Eşya yok</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {trade.status === 'pending' && isReceiver && (
                  <>
                    <button onClick={() => setAcceptModal({ isOpen: true, trade, selectedItems: [] })} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition">Kabul Et</button>
                    <button onClick={() => handleAction(trade.id, 'decline')} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition">Reddet</button>
                  </>
                )}
                {trade.status === 'pending' && isSender && (
                  <button onClick={() => handleAction(trade.id, 'cancel')} className="bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white border border-zinc-700 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition">İptal Et</button>
                )}
                {trade.status === 'accepted' && <span className="text-green-500 font-black uppercase tracking-widest text-sm">TAKAS TAMAMLANDI</span>}
                {trade.status === 'declined' && <span className="text-red-500 font-black uppercase tracking-widest text-sm">REDDEDİLDİ</span>}
                {trade.status === 'cancelled' && <span className="text-zinc-500 font-black uppercase tracking-widest text-sm">İPTAL EDİLDİ</span>}
              </div>
            </div>
          )
        })}
        {trades.length === 0 && (
          <div className="text-center py-20 text-zinc-500 hud-panel rounded-md uppercase tracking-widest text-xs font-bold border-dashed">
            Aktif bir takas teklifi yok. Profil sayfalarından arkadaşlarına teklif gönderebilirsin.
          </div>
        )}
      </div>

      {/* KABUL ETME MODALI (Kendi eşyalarını seçmek için) */}
      {acceptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="hud-panel p-6 rounded-md max-w-2xl w-full border border-green-500/30 relative">
            <button onClick={() => setAcceptModal({ isOpen: false, trade: null, selectedItems: [] })} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">Takası Onayla</h2>
            <p className="text-xs text-zinc-400 mb-4">Sana gelen teklifi kabul etmek üzeresin. İstersen karşı tarafa sen de eşya verebilirsin. (Opsiyonel)</p>
            
            <div className="mb-4 max-h-60 overflow-y-auto custom-scrollbar bg-black/40 p-4 border border-white/5 rounded-md grid grid-cols-2 sm:grid-cols-4 gap-2">
              {myInventory.filter(i => i.user_id === currentUser.id).map(item => (
                <div key={item.id} onClick={() => toggleSelectItem(item.id)} className={`p-2 rounded-sm border cursor-pointer transition ${acceptModal.selectedItems.includes(item.id) ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-zinc-900/50 hover:border-white/30'}`}>
                  <img src={item.skin_image} className="w-full h-16 object-contain mb-2" />
                  <div className="text-[9px] font-bold text-white truncate text-center">{item.skin_name}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setAcceptModal({ isOpen: false, trade: null, selectedItems: [] })} className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-sm text-xs font-bold text-white uppercase tracking-widest transition">Vazgeç</button>
              <button onClick={() => handleAction(acceptModal.trade.id, 'accept', acceptModal.selectedItems)} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-sm text-xs font-black uppercase tracking-widest transition">Takası Onayla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}