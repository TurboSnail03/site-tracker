import { useRef } from 'react'
import { Share2, Download, Upload, RefreshCw, Trash2, FileJson } from 'lucide-react'

export default function SetupTab({ isDarkMode, categories, setCategories, transactions, setTransactions, processImport }) {
  const fileInputRef = useRef(null)

  const handleCycleColor = (id) => {
    const newColor = `hsl(${Math.random() * 360}, 75%, 60%)`
    setCategories({ ...categories, [id]: { ...categories[id], color: newColor } })
  }

  const handleDelete = (id) => {
    if (window.confirm("Remove this material and all its history?")) {
      const updatedCats = { ...categories }
      delete updatedCats[id]
      setCategories(updatedCats)
      setTransactions(transactions.filter(tx => tx.categoryId !== id))
    }
  }

  const handleExport = () => {
    const data = JSON.stringify({ categories, transactions })
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `site-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const handleFileChange = (e) => {
    processImport(e.target.files[0])
    e.target.value = null
  }

  return (
    <div className="space-y-8 pb-10 transition-colors duration-300">
      {/* Material Management Section */}
      <div className="space-y-4">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic transition-colors ${
          isDarkMode ? 'text-slate-500' : 'text-amber-900/40'
        }`}>
          Material Management
        </h3>
        <div className="space-y-2">
          {Object.values(categories).map(cat => (
            <div key={cat.id} className={`p-4 rounded-[1.5rem] border flex items-center justify-between shadow-sm transition-all ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100/50'
            }`}>
              <div className="flex items-center gap-3">
                <button onClick={() => handleCycleColor(cat.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-md active:scale-90 transition-transform" style={{ backgroundColor: cat.color }}>
                  <RefreshCw size={14} />
                </button>
                <p className={`font-bold uppercase tracking-tight text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {cat.name}
                </p>
              </div>
              <button onClick={() => handleDelete(cat.id)} className="p-3 text-slate-300 hover:text-rose-500 active:scale-90 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Backup Card */}
      <div className="bg-blue-600 rounded-[2.5rem] p-7 text-white shadow-xl shadow-blue-500/30">
        <h2 className="text-xl font-black mb-2 flex items-center gap-2 tracking-tighter uppercase italic"><Share2 size={20}/> Cloud Backup</h2>
        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-relaxed mb-6 italic">Save data to your device</p>
        <button onClick={handleExport} className="w-full bg-white text-blue-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-[10px]">
          <Download size={16}/> Download JSON File
        </button>
      </div>

      {/* Restore Card (Kept dark to match the app header) */}
      <div className="bg-slate-800 dark:bg-slate-900 rounded-[2.5rem] p-7 border border-slate-700 dark:border-slate-800 shadow-xl">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 italic"><Upload size={16}/> Restore Data</h3>
        <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-slate-700 dark:bg-slate-800 hover:bg-slate-600 text-white font-black py-8 rounded-[2rem] border-4 border-dashed border-slate-600 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-xs"
        >
          <FileJson size={32} className="text-blue-400" />
          Click to upload JSON
        </button>
        <p className="text-[8px] text-slate-500 font-black uppercase text-center mt-4 tracking-widest leading-relaxed italic">
          Tip: You can drag and drop your file anywhere on the screen!
        </p>
      </div>
    </div>
  )
}