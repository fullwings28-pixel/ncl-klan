export default function Footer() {
  return (
    <footer className="w-full py-8 mt-auto border-t border-white/5 bg-[#050811] text-center relative z-10">
      <div className="flex flex-col items-center justify-center gap-1">
        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.4em] flex items-center gap-2">
          by <span className="text-red-500 text-sm tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">Viosy</span>
        </p>
        <p className="text-[9px] text-zinc-700 font-mono tracking-widest uppercase mt-1">
          NCL E-Sports &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}