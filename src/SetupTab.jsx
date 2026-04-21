import { useState, useEffect, useRef } from 'react'
import { Share2, Download, Upload, RefreshCw, Trash2, FileJson, FileText, Printer, Pencil } from 'lucide-react'

export default function SetupTab({
  isDarkMode,
  categories,
  setCategories,
  transactions,
  setTransactions,
  processImport,
  activeProject,
  switchProject,
  renameProject,
}) {
  const fileInputRef = useRef(null)
  const [projects, setProjects] = useState([])

  // Removed hardcoded "Site A" — list built only from storage + current active project
  useEffect(() => {
    const found = Object.keys(localStorage)
      .filter(k => k.startsWith('siteCategories_'))
      .map(k => k.replace('siteCategories_', ''))

    const projectList = [...new Set([...found, activeProject].filter(Boolean))]
    setProjects(projectList)
  }, [activeProject])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImport(e.target.files[0])
    }
    e.target.value = null
  }

  const handleRenameCurrent = () => {
    const newName = window.prompt(`Rename "${activeProject}" to:`, activeProject)
    if (newName && newName.trim() && newName !== activeProject) {
      if (typeof renameProject === 'function') {
        renameProject(activeProject, newName.trim())
      }
    }
  }

  const handleCycleColor = (id) => {
    const newColor = `hsl(${Math.random() * 360}, 75%, 60%)`
    setCategories({ ...categories, [id]: { ...categories[id], color: newColor } })
  }

  const handleDelete = (id) => {
    if (window.confirm('Remove this material and all its history?')) {
      const updatedCats = { ...categories }
      delete updatedCats[id]
      setCategories(updatedCats)
      setTransactions(transactions.filter(tx => tx.categoryId !== id))
    }
  }

  // FIX #5: Both export helpers now call revokeObjectURL immediately after
  // click() to prevent URL accumulation in memory across repeated exports.
  const handleExport = () => {
    const data = JSON.stringify({ categories, transactions })
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `${activeProject}-backup.json`
    link.click()
    URL.revokeObjectURL(url) // FIX #5
  }

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Material', 'Vendor', 'Amount']
    const rows = transactions.map(tx => {
      const catName = categories[tx.categoryId]?.name || 'Unknown'
      return `"${tx.date}","${tx.type}","${catName}","${tx.vendor || ''}",${tx.amount}`
    })
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `${activeProject}-export.csv`
    link.click()
    URL.revokeObjectURL(url) // FIX #5
  }

  // FIX #6: Guard against printWindow being null (happens when browser blocks
  // popups, which is common on Android). Without this, document.write() on a
  // null reference throws a TypeError and crashes the export silently.
  const handleExportPDF = () => {
    const printWindow = window.open('', '', 'height=800,width=800')

    if (!printWindow) {
      alert('Please allow popups for this site to use the Print PDF feature.')
      return
    }

    let html = `
      <html><head><title>${activeProject} Report</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 20px; color: #333; }
        h1 { color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 24px; margin-bottom: 5px; }
        p { color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-top: 0; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th, td { border-bottom: 1px solid #cbd5e1; padding: 12px 8px; text-align: left; }
        th { background-color: #f8fafc; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; color: #64748b; }
        .amount { font-family: monospace; font-size: 16px; }
      </style>
      </head><body>
      <h1>${activeProject} Report</h1>
      <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
      <table>
        <tr><th>Date</th><th>Material</th><th>Vendor</th><th>Type</th><th>Amount (₹)</th></tr>
    `
    transactions.forEach(tx => {
      const catName = categories[tx.categoryId]?.name || 'Unknown'
      html += `<tr>
        <td style="font-size: 12px; color: #475569;">${tx.date}</td>
        <td><b>${catName.toUpperCase()}</b></td>
        <td style="color: #64748b;">${tx.vendor || '-'}</td>
        <td>${tx.type.toUpperCase()}</td>
        <td class="amount">₹${tx.amount.toLocaleString('en-IN')}</td>
      </tr>`
    })
    html += `</table></body></html>`

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 250)
  }

  const cardStyle    = isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-amber-100 text-slate-800'
  const subTextStyle = isDarkMode ? 'text-slate-500' : 'text-amber-900/40'

  return (
    <div className="space-y-8 pb-10 transition-colors duration-300">

      {/* Project Selection */}
      <div className="space-y-4">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic ${subTextStyle}`}>
          Active Project
        </h3>

        <div className="flex gap-2">
          <select
            value={activeProject}
            onChange={(e) => {
              if (e.target.value === 'NEW') {
                const name = window.prompt('Enter new project name:')
                if (name && name.trim()) switchProject(name.trim())
              } else {
                switchProject(e.target.value)
              }
            }}
            className={`flex-1 p-4 rounded-[1.5rem] outline-none font-black text-sm tracking-tight border shadow-sm transition-all ${cardStyle}`}
          >
            {projects.map(p => (
              <option key={p} value={p}>{String(p).toUpperCase()}</option>
            ))}
            <option value="NEW" className="text-blue-500">+ CREATE NEW PROJECT...</option>
          </select>

          <button
            onClick={handleRenameCurrent}
            className={`p-4 rounded-2xl border shadow-sm active:scale-90 transition-all ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-blue-400'
                : 'bg-white border-amber-100 text-blue-600'
            }`}
          >
            <Pencil size={20} />
          </button>
        </div>
      </div>

      {/* Material Management */}
      <div className="space-y-4">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic ${subTextStyle}`}>
          Material Management
        </h3>
        <div className="space-y-2">
          {Object.values(categories).map(cat => (
            <div
              key={cat.id}
              className={`p-4 rounded-[1.5rem] border flex items-center justify-between shadow-sm transition-all ${cardStyle}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCycleColor(cat.id)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-md active:scale-90 transition-transform"
                  style={{ backgroundColor: cat.color }}
                >
                  <RefreshCw size={14} />
                </button>
                <p className="font-bold uppercase tracking-tight text-sm">{cat.name}</p>
              </div>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-3 text-slate-300 hover:text-rose-500 active:scale-90 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Export Card */}
      <div className="bg-blue-600 rounded-[2.5rem] p-7 text-white shadow-xl shadow-blue-500/30">
        <h2 className="text-xl font-black flex items-center gap-2 tracking-tighter uppercase italic mb-4">
          <Share2 size={20} /> Data Export
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={handleExportCSV}
            className="bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-colors uppercase tracking-widest text-[9px]"
          >
            <FileText size={14} /> Excel / CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-blue-700 hover:bg-blue-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-colors uppercase tracking-widest text-[9px]"
          >
            <Printer size={14} /> Print PDF
          </button>
        </div>
        <button
          onClick={handleExport}
          className="w-full bg-white text-blue-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-[10px]"
        >
          <Download size={16} /> Backup JSON Data
        </button>
      </div>

      {/* Restore Card */}
      <div className={`p-7 rounded-[2.5rem] border-2 border-dashed transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-amber-50/20 border-amber-200/50'
      } shadow-xl`}>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 italic">
          <Upload size={16} /> Restore Data
        </h3>
        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-slate-700 dark:bg-slate-800 hover:bg-slate-600 text-white font-black py-8 rounded-[2rem] border-4 border-dashed border-slate-600 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-xs"
        >
          <FileJson size={32} className="text-blue-400" />
          Click to upload JSON
        </button>
      </div>
    </div>
  )
}
