"use client"
import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"
import { ShieldBan, ShieldCheck, VolumeX, ShieldAlert, Plus, Save, Megaphone, Coins, X, Flag, Trash } from "lucide-react"
import { useToast } from "@/components/Toast"

export default function AdminPanelClient({ users, logs, bannedWords, reports, adminProfile }: any) {
  const [reason, setReason] = useState("")
  const [siteName, setSiteName] = useState("")
  const [newRoomName, setNewRoomName] = useState("")
  const [rooms, setRooms] = useState<any[]>([])
  const [announcement, setAnnouncement] = useState("")
  const [creditModal, setCreditModal] = useState({ isOpen: false, userId: "", userName: "", amount: "" })
  const { showToast } = useToast()

  useEffect(() => {
    fetch("/api/settings").then(res => res.json()).then(data => setSiteName(data.site_name))
    fetch("/api/rooms").then(res => res.json()).then(data => setRooms(data))
  }, [])

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
    const amount = parseInt(creditModal.amount);
    if (isNaN(amount) || amount === 0) return showToast("Geçerli bir sayı girin.", "error");

    const res = await fetch("/api/admin/give-credits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: creditModal.userId, amount })
    })

    if (res.ok) { showToast(`${amount} Kredi işlendi!`, "success"); setCreditModal({ isOpen: false, userId: "", userName: "", amount: "" }); setTimeout(() => window.location.reload(), 1000) } 
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
    else { showToast("Kelime eklenemedi (Zaten var olabilir).", "error") }
  }

  const handleDeleteBannedWord = async (id: number) => {
    await fetch(`/api/admin/banned-words?id=${id}`, { method: "DELETE" })
    showToast("Kelime silindi.", "success"); setTimeout(() => window.location.reload(), 1000)
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
                          <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1 mt-0.5 tracking-widest"><Coins size={10}/> {user.balance || 0} K</span>
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
                        <button onClick={() => setCreditModal({ isOpen: true, userId: user.id, userName: user.display_name, amount: "" })} className="bg-yellow-500/10 hover:bg-yellow-600 text-yellow-500 hover:text-white px-2.5 py-1.5 rounded-sm text-[10px] font-bold transition flex items-center gap-1 border border-yellow-500/30 uppercase tracking-widest"><Coins size={12} /> KREDİ</button>
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

      {creditModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setCreditModal({ ...creditModal, isOpen: false })}>
          <div className="hud-panel p-6 rounded-md max-w-sm w-full border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCreditModal({ ...creditModal, isOpen: false })} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"><X size={20} /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-500/10 p-3 rounded-sm border border-yellow-500/30"><Coins className="text-yellow-500" size={24} /></div>
              <div><h3 className="text-xl font-black text-white uppercase tracking-widest">KREDİ VER</h3><p className="text-[10px] text-yellow-500 font-bold tracking-widest mt-1">{creditModal.userName}</p></div>
            </div>
            <div className="space-y-4">
              <input type="number" value={creditModal.amount} onChange={(e) => setCreditModal({ ...creditModal, amount: e.target.value })} placeholder="Örn: 500" className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-yellow-500 font-black tracking-widest text-center text-lg" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setCreditModal({ ...creditModal, isOpen: false })} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest transition">İPTAL</button>
                <button onClick={submitCredits} className="flex-1 bg-yellow-600/20 hover:bg-yellow-600 border border-yellow-500/30 text-yellow-500 hover:text-white py-2.5 rounded-sm text-xs font-bold transition uppercase tracking-widest">ONAYLA</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}