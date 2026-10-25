"use client"
import { useRef, useState, useEffect } from "react"
import { Eraser, Pen, Trash2, Save } from "lucide-react"

// Harita görselleri (MurkyYT/cs2-map-icons - Doğrudan çalışan radar görselleri)
const MAPS = [
  { name: "Mirage", url: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_mirage_radar_psd.png" },
  { name: "Dust 2", url: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_dust2_radar_psd.png" },
  { name: "Inferno", url: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_inferno_radar_psd.png" },
  { name: "Nuke", url: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_nuke_radar_psd.png" },
  { name: "Ancient", url: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_ancient_radar_psd.png" },
  { name: "Anubis", url: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_anubis_radar_psd.png" },
  { name: "Vertigo", url: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_vertigo_radar_psd.png" },
  { name: "Overpass", url: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_overpass_radar_psd.png" },
]

export default function StratCanvas({ onSave }: { onSave: (data: string, mapName: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#ef4444")
  const [lineWidth, setLineWidth] = useState(3)
  const [isEraser, setIsEraser] = useState(false)
  const [selectedMap, setSelectedMap] = useState(MAPS[0])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 800
    canvas.height = 800
    const context = canvas.getContext("2d")
    if (context) {
      context.lineCap = "round"
      context.lineJoin = "round"
      contextRef.current = context
    }
  }, [])

  useEffect(() => {
    clearCanvas()
  }, [selectedMap])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const startDrawing = ({ nativeEvent }: any) => {
    const { offsetX, offsetY } = nativeEvent
    if (contextRef.current) {
      contextRef.current.beginPath()
      contextRef.current.moveTo(offsetX, offsetY)
      contextRef.current.strokeStyle = isEraser ? "rgba(0,0,0,1)" : color
      contextRef.current.lineWidth = lineWidth
      setIsDrawing(true)
    }
  }

  const draw = ({ nativeEvent }: any) => {
    if (!isDrawing || !contextRef.current) return
    const { offsetX, offsetY } = nativeEvent
    contextRef.current.lineTo(offsetX, offsetY)
    contextRef.current.stroke()
  }

  const stopDrawing = () => {
    if (contextRef.current) contextRef.current.closePath()
    setIsDrawing(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext("2d")
      
      if (tempCtx) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = selectedMap.url
        img.onload = () => {
          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
          tempCtx.drawImage(canvas, 0, 0)
          const dataUrl = tempCanvas.toDataURL("image/png")
          onSave(dataUrl, selectedMap.name)
        }
        img.onerror = () => {
          alert("Harita resmi yüklenemediği için kayıt yapılamadı. Lütfen internet bağlantınızı kontrol edin.")
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Araç Çubuğu */}
      <div className="flex flex-wrap items-center gap-4 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
        <select 
          value={selectedMap.name} 
          onChange={(e) => setSelectedMap(MAPS.find(m => m.name === e.target.value) || MAPS[0])}
          className="bg-zinc-800 text-white text-sm rounded-lg px-3 py-1.5 border border-zinc-700 focus:outline-none"
        >
          {MAPS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>

        <div className="flex items-center gap-2 border-l border-zinc-700 pl-4">
          <button onClick={() => setIsEraser(false)} className={`p-2 rounded-lg transition ${!isEraser ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`} title="Kalem"><Pen size={18}/></button>
          <button onClick={() => setIsEraser(true)} className={`p-2 rounded-lg transition ${isEraser ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`} title="Silgi"><Eraser size={18}/></button>
        </div>

        <div className="flex items-center gap-2 border-l border-zinc-700 pl-4">
          {['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ffffff'].map(c => (
            <button key={c} onClick={() => { setColor(c); setIsEraser(false); }} className={`w-6 h-6 rounded-full border-2 transition ${color === c && !isEraser ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-zinc-700 pl-4">
          <span className="text-xs text-zinc-400">Kalınlık:</span>
          <input type="range" min="1" max="10" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-20 accent-cyan-500" />
        </div>

        <div className="flex-1 flex justify-end gap-2">
          <button onClick={clearCanvas} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 border border-red-500/30">
            <Trash2 size={16}/> Temizle
          </button>
          <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2">
            <Save size={16}/> Kaydet
          </button>
        </div>
      </div>

      {/* Canvas ve Harita */}
      <div className="relative w-full aspect-square max-w-[800px] mx-auto bg-[#111113] rounded-xl overflow-hidden border border-zinc-700 cursor-crosshair shadow-2xl flex items-center justify-center">
        <img 
          src={selectedMap.url} 
          alt={selectedMap.name} 
          className="absolute inset-0 w-full h-full object-contain opacity-80 pointer-events-none" 
          onError={(e) => {
            console.error("Harita yüklenemedi:", selectedMap.url);
            e.currentTarget.style.display = 'none';
          }}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="absolute inset-0 w-full h-full z-10"
        />
      </div>
    </div>
  )
}