import { useState, useEffect, useRef } from 'react'
import { Share2, Download, Upload, RefreshCw, Trash2, FileJson, FileText, Printer, Pencil } from 'lucide-react'
import { cycleColor } from './colors'

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
    const newColor = cycleColor(categories[id]?.color)
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

  const handleExport = () => {
    const data = JSON.stringify({ categories, transactions })
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `${activeProject}-backup.json`
    link.click()
    URL.revokeObjectURL(url) 
  }

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Material', 'Vendor', 'Quantity', 'Unit', 'Amount']
    const rows = transactions.map(tx => {
      const cat = categories[tx.categoryId] || {}
      const catName = cat.name || 'Unknown'
      const catUnit = cat.unit || ''
      const qty = tx.quantity || ''
      
      return `"${tx.date}","${tx.type}","${catName}","${tx.vendor || ''}","${qty}","${catUnit}",${tx.amount}`
    })
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `${activeProject}-export.csv`
    link.click()
    URL.revokeObjectURL(url) 
  }

  // ── UPDATED: High-Contrast Light Mode PDF Export ───────────────────────────
  const handleExportPDF = () => {
    const printWindow = window.open('', '', 'height=800,width=800')

    if (!printWindow) {
      alert('Please allow popups for this site to use the Print PDF feature.')
      return
    }

    // 1. Calculate the Aggregates for the Report
    let globalCost = 0
    let globalPaid = 0
    
    const matStats = {}
    Object.values(categories).forEach(c => {
      matStats[c.id] = { ...c, totalCost: 0, totalPaid: 0, totalQty: 0 }
    })

    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        globalCost += tx.amount
        if (matStats[tx.categoryId]) {
          matStats[tx.categoryId].totalCost += tx.amount
          matStats[tx.categoryId].totalQty += (tx.quantity || 0)
        }
      } else {
        globalPaid += tx.amount
        if (matStats[tx.categoryId]) {
          matStats[tx.categoryId].totalPaid += tx.amount
        }
      }
    })

    const globalBalance = globalCost - globalPaid
    const isAdvanced = globalBalance < 0

    const activeMats = Object.values(matStats)
      .filter(m => m.totalCost > 0 || m.totalPaid > 0)
      .sort((a, b) => b.totalCost - a.totalCost)

    // 2. Build the exact HTML Replica (Light Mode)
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeProject} - Financial Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
        <style>
          /* Force Light Mode Printing with exact colors for graphs */
          @media print {
            body { background-color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .card { background-color: #ffffff !important; border-color: #e2e8f0 !important; }
            .stat-box { background-color: #f8fafc !important; border-color: #e2e8f0 !important; }
            th { background-color: #f1f5f9 !important; }
            tr:nth-child(even) td { background-color: #f8fafc !important; }
            tr:nth-child(odd) td { background-color: #ffffff !important; }
          }
          
          body { 
            font-family: 'Inter', sans-serif; 
            background-color: #ffffff; 
            color: #0f172a; 
            margin: 0; 
            padding: 40px; 
          }
          .container { max-w-[800px] margin: auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-weight: 900; margin: 0; font-size: 28px; letter-spacing: -1px; text-transform: uppercase; color: #0f172a; }
          .header p { margin: 5px 0 0 0; font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 2px; text-transform: uppercase; }
          
          .card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 30px; page-break-inside: avoid; }
          
          /* Hero Stats */
          .hero-label { font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; color: ${isAdvanced ? '#059669' : '#64748b'}; }
          .hero-amount { font-size: 48px; font-weight: 900; letter-spacing: -2px; margin: 0 0 20px 0; color: ${isAdvanced ? '#059669' : (globalBalance === 0 ? '#64748b' : '#e11d48')}; }
          
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .stat-box { background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .stat-label { font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; }
          .stat-val { font-size: 18px; font-weight: 900; margin: 0; color: #0f172a; }
          
          /* Graph */
          .bar-container { height: 12px; border-radius: 99px; background-color: #e2e8f0; display: flex; overflow: hidden; margin: 20px 0; }
          .legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; }
          .legend-item { display: flex; align-items: center; gap: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #475569; }
          .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

          /* Tables */
          h3 { font-size: 12px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #475569; margin: 40px 0 15px 0; }
          table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; font-size: 12px; border: 1px solid #e2e8f0; }
          th { background-color: #f1f5f9; color: #475569; font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          td { padding: 12px 16px; font-weight: 600; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
          tr:nth-child(even) td { background-color: #f8fafc; }
          tr:nth-child(odd) td { background-color: #ffffff; }
          .mono { font-family: monospace; font-size: 14px; font-weight: 700; }
          .text-red { color: #e11d48; }
          .text-green { color: #059669; }
          .text-blue { color: #2563eb; }
          .text-muted { color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1>${activeProject}</h1>
              <p>SiteTracker Financial Export</p>
            </div>
            <div style="text-align: right;">
              <p>Generated On</p>
              <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          <div class="card">
            <p class="hero-label">${isAdvanced ? 'Advanced Payment Surplus' : (globalBalance === 0 ? 'All Cleared' : 'Total Balance Due')}</p>
            <h2 class="hero-amount">${isAdvanced ? '+' : ''}₹${Math.abs(globalBalance).toLocaleString('en-IN')}</h2>
            
            <div class="grid-2">
              <div class="stat-box">
                <p class="stat-label">Total Material Cost</p>
                <p class="stat-val">₹${globalCost.toLocaleString('en-IN')}</p>
              </div>
              <div class="stat-box" style="border: 1px solid rgba(5,150,105,0.2); background-color: #ecfdf5 !important;">
                <p class="stat-label" style="color: #059669;">Total Payments Sent</p>
                <p class="stat-val text-green">₹${globalPaid.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          ${globalCost > 0 ? `
          <div class="card">
            <p class="hero-label" style="color: #64748b;">Cost Breakdown</p>
            <div class="bar-container">
              ${activeMats.map(m => `
                <div style="width: ${(m.totalCost / globalCost) * 100}%; background-color: ${m.color}; height: 100%;"></div>
              `).join('')}
            </div>
            <div class="legend">
              ${activeMats.slice(0, 6).map(m => `
                <div class="legend-item">
                  <div class="legend-dot" style="background-color: ${m.color};"></div>
                  ${m.name} (${Math.round((m.totalCost / globalCost) * 100)}%)
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <h3>Material Summaries & Inventory</h3>
          <table>
            <tr>
              <th>Material</th>
              <th>Total Quantity Delivered</th>
              <th>Total Cost</th>
              <th>Paid</th>
              <th style="text-align: right;">Status / Balance</th>
            </tr>
            ${activeMats.map(m => {
              const bal = m.totalCost - m.totalPaid;
              const isSurplus = bal < 0;
              const qtyStr = m.totalQty > 0 ? `${m.totalQty.toLocaleString('en-IN')} ${m.unit || 'Units'}` : '-';
              
              return `
              <tr>
                <td><b style="color: ${m.color};">${m.name.toUpperCase()}</b></td>
                <td class="text-blue">${qtyStr}</td>
                <td>₹${m.totalCost.toLocaleString('en-IN')}</td>
                <td class="text-green">₹${m.totalPaid.toLocaleString('en-IN')}</td>
                <td style="text-align: right;" class="${isSurplus ? 'text-green' : (bal > 0 ? 'text-red' : '')}">
                  <b>${isSurplus ? 'ADVANCE: ' : (bal > 0 ? 'DUE: ' : '')}${isSurplus ? '+' : ''}₹${Math.abs(bal).toLocaleString('en-IN')}</b>
                </td>
              </tr>
              `
            }).join('')}
          </table>

          <h3>Complete Transaction Log</h3>
          <table>
            <tr>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Material</th>
              <th>Vendor</th>
              <th>Quantity</th>
              <th style="text-align: right;">Amount</th>
            </tr>
            ${transactions.map(tx => {
              const cat = categories[tx.categoryId] || { name: 'Unknown', color: '#94a3b8' }
              const isExp = tx.type === 'expense'
              const dateObj = new Date(tx.date)
              // Updated to include full year and time
              const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' &bull; ' + dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' })
              const qtyStr = tx.quantity ? `${tx.quantity.toLocaleString('en-IN')} ${cat.unit || ''}` : '-'

              return `
              <tr>
                <td class="text-muted" style="font-size: 11px;">${dateStr.toUpperCase()}</td>
                <td><b class="${isExp ? 'text-red' : 'text-green'}">${isExp ? 'EXPENSE' : 'PAYMENT'}</b></td>
                <td><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${cat.color}; margin-right:6px;"></span><b>${cat.name.toUpperCase()}</b></td>
                <td class="text-muted">${tx.vendor || '-'}</td>
                <td class="text-blue">${qtyStr}</td>
                <td class="mono ${isExp ? 'text-red' : 'text-green'}" style="text-align: right;">${isExp ? '' : '+'}₹${tx.amount.toLocaleString('en-IN')}</td>
              </tr>
              `
            }).join('')}
          </table>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    // Timeout gives browser time to render Google Fonts before opening print dialog
    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
  }

  const card   = isDarkMode ? 'bg-slate-900 border-slate-800/70 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800'
  const subtle = isDarkMode ? 'text-slate-500' : 'text-slate-400'
  const inputBg = isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-50 text-slate-800'

  return (
    <div className="space-y-6 pb-10">

      {/* ── Active Project ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ml-1 ${subtle}`}>
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
            className={`flex-1 p-4 rounded-xl outline-none font-bold text-sm tracking-tight border shadow-sm transition-all ${card}`}
          >
            {projects.map(p => (
              <option key={p} value={p}>{String(p).toUpperCase()}</option>
            ))}
            <option value="NEW" className="text-blue-500">+ CREATE NEW PROJECT…</option>
          </select>

          <button
            onClick={handleRenameCurrent}
            className={`p-4 rounded-xl border shadow-sm active:scale-90 transition-all ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700/60 text-blue-400 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
            }`}
          >
            <Pencil size={18} />
          </button>
        </div>
      </div>

      {/* ── Material Management ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ml-1 ${subtle}`}>
          Materials
        </h3>
        <div className="space-y-2">
          {Object.values(categories).length === 0 && (
            <p className={`text-[10px] text-center py-6 ${subtle}`}>No materials added yet.</p>
          )}
          {Object.values(categories).map(cat => (
            <div
              key={cat.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between shadow-sm transition-all ${card}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCycleColor(cat.id)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md active:scale-90 transition-transform shrink-0"
                  style={{ backgroundColor: cat.color }}
                  title="Cycle color"
                >
                  <RefreshCw size={13} />
                </button>
                <div className="flex items-center flex-wrap gap-2">
                  <p className="font-semibold uppercase tracking-tight text-sm">{cat.name}</p>
                  
                  {cat.unit && (
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.unit}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(cat.id)}
                className={`p-2 rounded-lg transition-all active:scale-90 shrink-0 ${subtle} hover:text-rose-500 hover:bg-rose-50`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Export Card ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/30">
        <h2 className="text-base font-black flex items-center gap-2 tracking-tight uppercase mb-4">
          <Share2 size={18} /> Data Export
        </h2>
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-blue-500/60 hover:bg-blue-500/80 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
          >
            <FileText size={14} /> Excel / CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-blue-500/60 hover:bg-blue-500/80 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
          >
            <Printer size={14} /> Print PDF
          </button>
        </div>
        <button
          onClick={handleExport}
          className="w-full bg-white text-blue-600 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform text-[10px] uppercase tracking-widest hover:bg-blue-50"
        >
          <Download size={15} /> Backup JSON
        </button>
      </div>

      {/* ── Restore Card ──────────────────────────────────────────────────── */}
      <div className={`p-6 rounded-2xl border-2 border-dashed transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
      }`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2 ${subtle}`}>
          <Upload size={14} /> Restore Data
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
          className={`w-full py-7 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-xs font-bold uppercase tracking-widest ${
            isDarkMode
              ? 'border-slate-700 hover:border-blue-600/50 text-slate-400 hover:text-blue-400'
              : 'border-slate-300 hover:border-blue-400 text-slate-400 hover:text-blue-500'
          }`}
        >
          <FileJson size={28} className="text-blue-500" />
          Click to upload JSON
        </button>
      </div>
    </div>
  )
}