"use client"
import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"
import { ShieldBan, ShieldCheck, VolumeX, ShieldAlert, Plus, Save, Coins, X, Flag, Trash, Sparkles, Wand2, Search } from "lucide-react"
import { useToast } from "@/components/Toast"
import { fetchSkins, Skin } from "@/lib/csgo-api"
import { getWear, getFloatMultiplier, getSkinMultiplier, RARITY_BASE_PRICES } from "@/lib/economy"

export default function AdminPanelClient({ users, logs, bannedWords, reports, adminProfile }: any) {
  const [reason, setReason] = useState("")
  
  // Ayarlar, Odalar, Duyurular State'leri
  const [siteName, setSiteName] = useState("")
  const [newRoomName, setNewRoomName] = useState("")
  const [rooms, setRooms] = useState<any[]>([])
  const [announcement, setAnnouncement] = useState("")
  
  // Kredi Verme Modalı
  const [creditModal, setCreditModal] = useState({ isOpen: false, userId: "", userName: "", amount: "" })

  // KASA OLUŞTURMA STATE'LERİ
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [caseName, setCaseName] = useState("")
  const [casePrompt, setCasePrompt] = useState("")
  const [casePrice, setCasePrice] = useState("2.50")
  const [caseImageUrl, setCaseImageUrl] = useState("")
  const [caseItems, setCaseItems] = useState<any[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // SKİN SEÇİCİ (SKIN PICKER) STATE'LERİ
  const [isSkinPickerOpen, setIsSkinPickerOpen] = useState(false)
  const [allSkins, setAllSkins] = useState<Skin[]>([])
  const [skinSearch, setSkinSearch] = useState("")
  const [isLoadingSkins, setIsLoadingSkins] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    fetch("/api/settings").then(res => res.json()).then(data => setSiteName(data.site_name))
    fetch("/api/rooms").then(res => res.json()).then(data => setRooms(data))
  }, [])

  // Skin Picker açıldığında tüm skinleri çek
  const openSkinPicker = async () => {
    setIsSkinPickerOpen(true)
    if (allSkins.length === 0) {
      setIsLoadingSkins(true)
      const skins = await fetchSkins()
      setAllSkins(skins)
      setIsLoadingSkins(false)
    }
  }

  // Skin Seçildiğinde forma ekle
  const handleSelectSkin = (skin: Skin) => {
    // Skinin tahmini fiyatını hesapla (Nadirlik + Popülerlik)
    const basePrice = RARITY_BASE_PRICES[skin.rarity.name] || 1.00
    const multiplier = getSkinMultiplier(skin.name)
    const estimatedPrice = (basePrice * multiplier).toFixed(2)

    setCaseItems([
      ...caseItems, 
      { 
        skin_id: skin.id,
        skin_name: skin.name, 
        skin_image: skin.image, 
        skin_rarity: skin.rarity.name, 
        chance: "10", // Varsayılan %10 şans
        price: estimatedPrice 
      }
    ])
    setIsSkinPickerOpen(false)
    setSkinSearch("")
  }

  // Filtrelenmiş skinler
  const filteredSkins = allSkins.filter(s => 
    s.name.toLowerCase().includes(skinSearch.toLowerCase()) || 
    s.weapon?.name.toLowerCase().includes(skinSearch.toLowerCase())
  )

  const handleAction = async (userId: string, action: string) => {
    const res = await fetch("/api/admin/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: userId, action, reason }) })
    if (res.ok) { showToast(`İşlem başarılı: ${action}`, "success"); setTimeout(() => window.location.reload(), 1000) } 
    else { showToast("İşlem başarısız", "error") }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch("/api/admin/update-role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: userId, newRole }) })
    if (res.ok) { showToast("Rol güncellendi.", "success"); setTimeout(() => window.location.reload(), 1000) } 
    else { showToast("Rol güncellenemedi", "error") }
  }

  const submitCredits = async () => {
    const amount = parseFloat(creditModal.amount);
    if (isNaN(amount) || amount === 0) return showToast("Geçerli bir sayı girin.", "error");

    const res = await fetch("/api/admin/give-credits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: creditModal.userId, amount })
    })

    if (res.ok) { showToast(`$${amount} işlendi!`, "success"); setCreditModal({ isOpen: false, userId: "", userName: "", amount: "" }); setTimeout(() => window.location.reload(), 1000) } 
    else { showToast("İşlem başarısız", "error") }
  }

  const handleSaveSettings = async () => {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site_name: siteName }) })
    showToast("Site ismi güncellendi!", "success"); setTimeout(() => window.location.reload(), 1000)
  }

  const handleCreateRoom = async () => {
    if(!newRoomName.trim()) return
    await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newRoomName }) })
    setNewRoomName(""); showToast("Oda oluşturuldu!", "success"); setTimeout(() => window.location.reload(), 1000)
  }

  const handleSendAnnouncement = async () => {
    if(!announcement.trim()) return
    await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: announcement }) })
    setAnnouncement(""); showToast("Duyuru yayınlandı!", "success")
  }

  const handleAddBannedWord = async (word: string) => {
    if(!word.trim()) return
    const res = await fetch("/api/admin/banned-words", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word }) })
    if (res.ok) { showToast("Kelime eklendi!", "success"); setTimeout(() => window.location.reload(), 1000) } 
    else { showToast("Kelime eklenemedi.", "error") }
  }

  const handleDeleteBannedWord = async (id: number) => {
    await fetch(`/api/admin/banned-words?id=${id}`, { method: "DELETE" })
    showToast("Kelime silindi.", "success"); setTimeout(() => window.location.reload(), 1000)
  }

  const generateCaseImage = () => {
    if (!casePrompt.trim()) return showToast("Lütfen bir görsel komutu girin.", "error")
    setIsGeneratingImage(true)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(casePrompt)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 10000)}`
    setCaseImageUrl(url)
    setTimeout(() => setIsGeneratingImage(false), 2000)
  }

  const handleSaveCase = async () => {
    if (!caseName.trim() || !caseImageUrl || caseItems.length === 0) return showToast("Lütfen isim, resim ve en az bir eşya ekleyin.", "error")
    
    const totalChance = caseItems.reduce((sum, item) => sum + Number(item.chance), 0)
    if (totalChance > 100) return showToast("Toplam şans %100'ü geçemez!", "error")

    const res = await fetch("/api/admin/cases", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: caseName, image_url: caseImageUrl, price: parseFloat(casePrice), items: caseItems })
    })
    
    if (res.ok) { 
      showToast("Özel kasa başarıyla oluşturuldu!", "success")
      setShowCaseModal(false)
      setCaseName(""); setCaseImageUrl(""); setCaseItems([])
    } else { 
      showToast("Kasa oluşturulamadı.", "error") 
    }
  }

  return (
    <main className="min-h-screen relative pb-12">
      <Navbar profile={adminProfile} />
      
      <div className="max-w-[1400px] mx-auto p-6 md:p-8 pt-12 relative z-10 space-y-8">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-3 rounded-sm border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="text-red-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-widest">YÖNETİM TERMİNALİ</h1>
            <p className="text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase mt-1">Sistem Kontrolü</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
          
          <div className="hud-panel p-4 rounded-md flex flex-col justify-between">
            <div>
              <h2 className="text-[10px] font-bold mb-3 text-zinc-400 uppercase tracking-[0.2em]">SİTE İSMİ</h2>
              <div className="flex gap-2 items-center w-full">
                <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Site İsmi" className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
                <button onClick={handleSaveSettings} className="shrink-0 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/30 px-3 py-2 rounded-sm text-xs font-semibold transition"><Save size={14}/></button>
              </div>
            </div>
          </div>

          <div className="hud-panel p-4 rounded-md flex flex-col justify-between">
            <div>
              <h2 className="text-[10px] font-bold mb-3 text-zinc-400 uppercase tracking-[0.2em]">SOHBET ODALARI</h2>
              <div className="flex gap-2 items-center w-full mb-2">
                <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Yeni Oda" className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
                <button onClick={handleCreateRoom} className="shrink-0 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 px-3 py-2 rounded-sm text-xs font-semibold transition"><Plus size={14}/></button>
              </div>
            </div>
          </div>

          <div className="hud-panel p-4 rounded-md flex flex-col justify-between">
            <div>
              <h2 className="text-[10px] font-bold mb-3 text-red-500 uppercase tracking-[0.2em]">DUYURU</h2>
              <div className="flex gap-2 items-center w-full">
                <input type="text" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Duyuru metni..." className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500" />
                <button onClick={handleSendAnnouncement} className="shrink-0 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-2 rounded-sm text-xs font-semibold transition uppercase tracking-wider">YAYINLA</button>
              </div>
            </div>
          </div>

          <div className="hud-panel p-4 rounded-md flex flex-col justify-between">
            <div>
              <h2 className="text-[10px] font-bold mb-3 text-yellow-500 uppercase tracking-[0.2em]">KÜFÜR FİLTRESİ</h2>
              <div className="flex gap-2 items-center w-full mb-2">
                <input type="text" id="bannedWordInput" placeholder="Yasaklı Kelime" className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500" />
                <button onClick={() => { const input = document.getElementById('bannedWordInput') as HTMLInputElement; handleAddBannedWord(input.value); input.value = ""; }} className="shrink-0 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-500 hover:text-white border border-yellow-500/30 px-3 py-2 rounded-sm text-xs font-semibold transition"><Plus size={14}/></button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                {bannedWords.map((bw: any) => (
                  <span key={bw.id} className="bg-white/5 text-[10px] px-2 py-1 rounded-sm border border-white/10 flex items-center gap-1 group text-zinc-300">
                    {bw.word}
                    <button onClick={() => handleDeleteBannedWord(bw.id)} className="text-zinc-500 hover:text-red-500 transition"><X size={10}/></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="hud-panel p-4 rounded-md flex flex-col justify-between">
            <div>
              <h2 className="text-[10px] font-bold mb-3 text-orange-500 flex items-center gap-1 uppercase tracking-[0.2em]"><Flag size={12}/> ŞİKAYETLER</h2>
              <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1">
                {reports.map((r: any) => (
                  <div key={r.id} className="text-[10px] bg-black/40 p-2 rounded-sm border border-white/5 text-zinc-400">
                    <span className="font-bold text-white">{r.reporter?.display_name}</span> → <span className="text-orange-400">{r.reported?.display_name}</span>
                    <br/>
                    Sebep: {r.reason}
                  </div>
                ))}
                {reports.length === 0 && <div className="text-[10px] text-zinc-600 uppercase tracking-widest">Şikayet yok.</div>}
              </div>
            </div>
          </div>

        </div>

        <div className="hud-panel p-5 rounded-md flex justify-between items-center border border-purple-500/30">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="text-purple-500" size={20}/> Özel Kasa Yönetimi
            </h2>
            <p className="text-zinc-400 text-xs mt-1">Yapay zeka ile klana özel kasalar oluştur.</p>
          </div>
          <button onClick={() => setShowCaseModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Plus size={16}/> Yeni Kasa Oluştur
          </button>
        </div>

        <div>
          <input type="text" placeholder="İŞLEM SEBEBİ (BAN/MUTE İÇİN)" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-[#0a0f1c] rounded-sm border border-white/5 px-5 py-3 mb-4 text-xs font-bold focus:outline-none focus:border-red-500/50 text-white placeholder-zinc-600 tracking-widest" />
          
          <div className="hud-panel rounded-md overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/60 text-zinc-500 text-[10px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="p-4 font-bold w-1/4">KULLANICI</th>
                  <th className="p-4 font-bold w-1/5">ROL</th>
                  <th className="p-4 font-bold w-1/6">DURUM</th>
                  <th className="p-4 font-bold text-right">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar_url} className="w-10 h-10 rounded-sm border border-white/10 object-cover grayscale-[30%]" alt="" />
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm uppercase tracking-wide">{user.display_name}</span>
                          <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-0.5 tracking-widest">${Number(user.balance || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="bg-black/50 text-white text-[10px] uppercase font-bold tracking-widest rounded-sm px-2 py-1.5 border border-white/10 focus:outline-none w-full max-w-[120px]">
                        <option value="member">ÜYE</option>
                        <option value="vip">VIP</option>
                        <option value="retired">EMEKLİ</option>
                        <option value="moderator">MOD</option>
                        <option value="admin">ADMİN</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {user.is_banned && <span className="text-red-500 text-[9px] font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-widest"><ShieldBan size={10}/> BANLI</span>}
                        {user.is_muted && <span className="text-yellow-500 text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-widest"><VolumeX size={10}/> MUTE</span>}
                        {!user.is_banned && !user.is_muted && <span className="text-green-500 text-[9px] font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-widest"><ShieldCheck size={10}/> AKTİF</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button onClick={() => setCreditModal({ isOpen: true, userId: user.id, userName: user.display_name, amount: "" })} className="bg-yellow-500/10 hover:bg-yellow-600 text-yellow-500 hover:text-white px-2.5 py-1.5 rounded-sm text-[10px] font-bold transition flex items-center gap-1 border border-yellow-500/30 uppercase tracking-widest"><Coins size={12} /> BAKİYE</button>
                        {user.is_banned ? <button onClick={() => handleAction(user.id, 'unban')} className="bg-white/5 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-sm text-[10px] font-bold transition border border-white/10 uppercase tracking-widest">BAN KALDIR</button> : <button onClick={() => handleAction(user.id, 'ban')} className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-2.5 py-1.5 rounded-sm text-[10px] font-bold transition border border-red-500/30 uppercase tracking-widest">BANLA</button>}
                        {user.is_muted ? <button onClick={() => handleAction(user.id, 'unmute')} className="bg-white/5 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-sm text-[10px] font-bold transition border border-white/10 uppercase tracking-widest">MUTE KALDIR</button> : <button onClick={() => handleAction(user.id, 'mute')} className="bg-yellow-500/10 hover:bg-yellow-600 text-yellow-500 hover:text-white px-2.5 py-1.5 rounded-sm text-[10px] font-bold transition border border-yellow-500/30 uppercase tracking-widest">MUTE</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="hud-panel border border-white/5 rounded-md p-5">
          <h2 className="text-[10px] font-bold mb-3 text-zinc-400 uppercase tracking-[0.2em]">SİSTEM LOGLARI</h2>
          <ul className="space-y-2">
            {logs.map((log: any) => (
              <li key={log.id} className="text-[11px] bg-black/40 p-2.5 rounded-sm border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
                <div>
                  <span className="text-white font-bold uppercase">{log.profiles?.display_name || 'ADMİN'}</span> 
                  <span className="mx-2 text-zinc-600">→</span> 
                  <span className={`font-black uppercase ${log.action_type.includes('ban') ? 'text-red-500' : log.action_type.includes('mute') ? 'text-yellow-500' : 'text-green-500'}`}>{log.action_type}</span> 
                  {log.reason && <span className="text-zinc-500 ml-2 italic">"{log.reason}"</span>}
                </div>
                <span className="text-[9px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded-sm">{new Date(log.created_at).toLocaleString('tr-TR')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* KREDİ VERME MODALI */}
      {creditModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setCreditModal({ ...creditModal, isOpen: false })}>
          <div className="hud-panel p-6 rounded-md max-w-sm w-full border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCreditModal({ ...creditModal, isOpen: false })} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"><X size={20} /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-500/10 p-3 rounded-sm border border-yellow-500/30"><Coins className="text-yellow-500" size={24} /></div>
              <div><h3 className="text-xl font-black text-white uppercase tracking-widest">BAKİYE VER</h3><p className="text-[10px] text-yellow-500 font-bold tracking-widest mt-1">{creditModal.userName}</p></div>
            </div>
            <div className="space-y-4">
              <input type="number" value={creditModal.amount} onChange={(e) => setCreditModal({ ...creditModal, amount: e.target.value })} placeholder="Örn: 50.00" className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-yellow-500 font-black tracking-widest text-center text-lg" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setCreditModal({ ...creditModal, isOpen: false })} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest transition">İPTAL</button>
                <button onClick={submitCredits} className="flex-1 bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-500 hover:text-white py-2.5 rounded-sm text-xs font-bold transition uppercase tracking-widest">ONAYLA</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KASA OLUŞTURMA MODALI */}
      {showCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto custom-scrollbar">
          <div className="bg-[#0a0f1c] border border-white/10 p-6 rounded-md max-w-5xl w-full my-8 relative shadow-2xl">
            <button onClick={() => setShowCaseModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={24}/></button>
            
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Wand2 className="text-purple-500" size={28}/> Yapay Zeka Kasa Oluşturucu
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              
              {/* SOL TARAF: KASA BİLGİLERİ */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Kasa İsmi</label>
                  <input type="text" value={caseName} onChange={e => setCaseName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-bold" placeholder="Örn: NCL Seçkin Kasa" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Kasa Fiyatı ($)</label>
                  <input type="number" value={casePrice} onChange={e => setCasePrice(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-bold" />
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-2">Yapay Zeka Resim Komutu</label>
                  <div className="flex gap-2">
                    <input type="text" value={casePrompt} onChange={e => setCasePrompt(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" placeholder="Örn: Futuristic neon weapon crate, dark background" />
                    <button onClick={generateCaseImage} disabled={isGeneratingImage} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-sm text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 uppercase tracking-widest">
                      {isGeneratingImage ? "Üretiliyor..." : "RESİM ÜRET"}
                    </button>
                  </div>
                </div>

                {caseImageUrl && (
                  <div className="mt-4 p-4 bg-black/40 border border-white/10 rounded-sm flex flex-col items-center">
                    <img src={caseImageUrl} alt="Kasa" className="w-48 h-48 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                    <span className="text-[10px] text-green-500 font-bold mt-2 uppercase tracking-widest">Resim Hazır</span>
                  </div>
                )}
              </div>
              
              {/* SAĞ TARAF: İÇERİK EKLEME */}
              <div className="bg-black/30 border border-white/5 p-5 rounded-md flex flex-col h-[500px]">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2 shrink-0">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Kasa İçeriği</h3>
                  <div className={`text-xs font-bold ${caseItems.reduce((sum, item) => sum + Number(item.chance), 0) > 100 ? "text-red-500" : "text-green-500"}`}>
                    Toplam Şans: %{caseItems.reduce((sum, item) => sum + Number(item.chance), 0)}
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
                  {caseItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-black/40 p-2 border border-white/5 rounded-sm">
                      <img src={item.skin_image} alt={item.skin_name} className="w-10 h-10 object-contain" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-white truncate">{item.skin_name}</div>
                        <div className="text-[8px] text-zinc-500 uppercase">{item.skin_rarity}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <label className="text-[8px] text-zinc-500 font-bold uppercase mb-0.5">Şans %</label>
                        <input type="number" value={item.chance} onChange={(e) => { const newItems = [...caseItems]; newItems[idx].chance = e.target.value; setCaseItems(newItems); }} className="w-16 bg-[#050811] border border-white/10 rounded-sm px-2 py-1 text-center text-xs text-white" />
                      </div>
                      <div className="flex flex-col items-center">
                        <label className="text-[8px] text-zinc-500 font-bold uppercase mb-0.5">Fiyat $</label>
                        <input type="number" value={item.price} onChange={(e) => { const newItems = [...caseItems]; newItems[idx].price = e.target.value; setCaseItems(newItems); }} className="w-20 bg-[#050811] border border-white/10 rounded-sm px-2 py-1 text-center text-xs text-white" />
                      </div>
                      <button onClick={() => setCaseItems(caseItems.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-sm transition self-end mb-0.5"><Trash size={14}/></button>
                    </div>
                  ))}
                  {caseItems.length === 0 && <div className="text-center py-6 text-zinc-600 text-xs uppercase tracking-widest">Henüz eşya eklenmedi.</div>}
                </div>
                
                <button onClick={openSkinPicker} className="w-full mt-4 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white text-xs font-bold py-3 rounded-sm transition uppercase tracking-widest flex items-center justify-center gap-2 shrink-0">
                  <Search size={14}/> Skin Seç ve Ekle
                </button>
              </div>
            </div>

            <button onClick={handleSaveCase} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-sm text-sm uppercase tracking-widest transition shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              Kasayı Sisteme Kaydet
            </button>
          </div>
        </div>
      )}

      {/* SKİN SEÇİCİ MODALI */}
      {isSkinPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0a0f1c] border border-white/10 p-6 rounded-md max-w-4xl w-full relative shadow-2xl flex flex-col h-[80vh]">
            <button onClick={() => setIsSkinPickerOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={24}/></button>
            
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">Skin Seç</h2>
            
            <div className="relative mb-4 shrink-0">
              <Search size={18} className="absolute left-3 top-3 text-zinc-500" />
              <input 
                type="text" 
                value={skinSearch} 
                onChange={e => setSkinSearch(e.target.value)} 
                placeholder="Skin veya Silah Ara (Örn: AWP Asiimov)" 
                className="w-full bg-black/50 border border-white/10 rounded-sm pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" 
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {isLoadingSkins ? (
                <div className="text-center py-20 text-purple-500 animate-pulse font-bold uppercase tracking-widest">Skinler Yükleniyor...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredSkins.slice(0, 100).map(skin => {
                    const basePrice = RARITY_BASE_PRICES[skin.rarity.name] || 1
                    const estimatedPrice = (basePrice * getSkinMultiplier(skin.name)).toFixed(2)
                    return (
                      <div 
                        key={skin.id} 
                        onClick={() => handleSelectSkin(skin)}
                        className="bg-black/40 border border-white/5 rounded-sm p-2 cursor-pointer hover:border-purple-500/50 transition flex flex-col items-center text-center group"
                      >
                        <img src={skin.image} alt={skin.name} className="w-full h-16 object-contain mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-[10px] font-bold text-white truncate w-full">{skin.name}</div>
                        <div className="text-[9px] text-zinc-500 uppercase mt-0.5">{skin.rarity.name}</div>
                        <div className="text-[10px] text-green-400 font-black mt-1">~${estimatedPrice}</div>
                      </div>
                    )
                  })}
                  {filteredSkins.length === 0 && <div className="col-span-full text-center py-10 text-zinc-500 uppercase tracking-widest text-xs">Sonuç bulunamadı.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  )
}