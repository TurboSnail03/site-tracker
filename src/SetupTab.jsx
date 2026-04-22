import { useState, useEffect, useRef } from 'react'
import { 
  Share2, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  FileJson, 
  FileText, 
  Printer, 
  Pencil
} from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { cycleColor } from './colors'
import { syncToDrive, fetchFromDrive } from './driveSync'
import { db } from './db' // ADDED: Import the database to scan projects
import { useLiveQuery } from 'dexie-react-hooks' // ADDED: To keep projects dropdown live

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
  
  // ── UPDATED: Scan Dexie DB for projects instead of localStorage ───────────
  const dbProjects = useLiveQuery(() => db.projects.toArray())
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (dbProjects) {
      const projectNames = dbProjects.map(p => p.name)
      // Ensure activeProject is always in the list even if DB is catching up
      setProjects([...new Set([...projectNames, activeProject].filter(Boolean))])
    }
  }, [dbProjects, activeProject])
  
  // ── NEW: Cloud Sync UI States ─────────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, success, error
  const [lastSync, setLastSync] = useState(() => localStorage.getItem('siteLastSync') || null)

  // ── NEW: Google Drive Logic (Minimal Injection) ───────────────────────────
  const loginForSync = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSyncStatus('syncing')
      // Fetch full DB for backup, not just active project
      const allCats = await db.categories.toArray()
      const allTxs = await db.transactions.toArray()
      const allProjs = await db.projects.toArray()
      
      const data = { categories: allCats, transactions: allTxs, projects: allProjs }
      const success = await syncToDrive(tokenResponse.access_token, data)
      
      if (success) {
        const timeStr = new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })
        setLastSync(timeStr); localStorage.setItem('siteLastSync', timeStr)
        setSyncStatus('success')
      } else { setSyncStatus('error') }
      setTimeout(() => setSyncStatus('idle'), 3000)
    },
    scope: 'https://www.googleapis.com/auth/drive.appdata',
  })

  const loginForRestore = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSyncStatus('syncing')
      const cloudData = await fetchFromDrive(tokenResponse.access_token)
      if (cloudData && cloudData.categories && cloudData.transactions) {
        if (window.confirm("Cloud backup found! OVERWRITE all local data with cloud version?")) {
          // Atomic restore
          await db.transaction('rw', db.projects, db.categories, db.transactions, async () => {
            await db.projects.clear()
            await db.categories.clear()
            await db.transactions.clear()
            
            if(cloudData.projects) await db.projects.bulkAdd(cloudData.projects)
            await db.categories.bulkAdd(cloudData.categories)
            await db.transactions.bulkAdd(cloudData.transactions)
          })
          setSyncStatus('success')
          alert("Restore Complete. Please restart the app.")
        } else { setSyncStatus('idle') }
      } else {
        alert("No backup file found on Google Drive."); setSyncStatus('error')
      }
      setTimeout(() => setSyncStatus('idle'), 3000)
    },
    scope: 'https://www.googleapis.com/auth/drive.appdata',
  })

  // ── YOUR ORIGINAL HANDLERS (Untouched except DB wiring) ───────────────────
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

  // UPDATED: Uses setCategories prop (which maps to db.categories.bulkPut in App.jsx)
  const handleCycleColor = (id) => {
    const newColor = cycleColor(categories[id]?.color)
    const updatedCats = { ...categories, [id]: { ...categories[id], color: newColor } }
    setCategories(updatedCats) 
  }

  // UPDATED: Triggers DB deletion
  const handleDelete = async (id) => {
    if (window.confirm('Remove this material and all its history?')) {
      await db.categories.delete(id)
      const txsToDelete = transactions.filter(tx => tx.categoryId === id).map(tx => tx.id)
      await db.transactions.bulkDelete(txsToDelete)
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

  const handleExportPDF = () => {
    const printWindow = window.open('', '', 'height=800,width=800')
    if (!printWindow) {
      alert('Please allow popups for this site to use the Print PDF feature.')
      return
    }

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

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeProject} - Financial Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
        <style>
          @media print {
            body { background-color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .card { background-color: #ffffff !important; border-color: #e2e8f0 !important; }
            .stat-box { background-color: #f8fafc !important; border-color: #e2e8f0 !important; }
            th { background-color: #f1f5f9 !important; }
            tr:nth-child(even) td { background-color: #f8fafc !important; }
            tr:nth-child(odd) td { background-color: #ffffff !important; }
          }
          body { font-family: 'Inter', sans-serif; background-color: #ffffff; color: #0f172a; margin: 0; padding: 40px; }
          .container { max-w-[800px] margin: auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-weight: 900; margin: 0; font-size: 28px; letter-spacing: -1px; text-transform: uppercase; color: #0f172a; }
          .header p { margin: 5px 0 0 0; font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 2px; text-transform: uppercase; }
          .card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 30px; page-break-inside: avoid; }
          .hero-label { font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; color: ${isAdvanced ? '#059669' : '#64748b'}; }
          .hero-amount { font-size: 48px; font-weight: 900; letter-spacing: -2px; margin: 0 0 20px 0; color: ${isAdvanced ? '#059669' : (globalBalance === 0 ? '#64748b' : '#e11d48')}; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .stat-box { background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .stat-label { font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #64748b; margin: 0 0 4px 0; }
          .stat-val { font-size: 18px; font-weight: 900; margin: 0; color: #0f172a; }
          .bar-container { height: 12px; border-radius: 99px; background-color: #e2e8f0; display: flex; overflow: hidden; margin: 20px 0; }
          .legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; }
          .legend-item { display: flex; align-items: center; gap: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #475569; }
          .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
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
            <div class="bar-container">${activeMats.map(m => `<div style="width: ${(m.totalCost/globalCost)*100}%; background-color: ${m.color}; height: 100%;"></div>`).join('')}</div>
            <div class="legend">${activeMats.slice(0, 6).map(m => `<div class="legend-item"><div class="legend-dot" style="background-color: ${m.color};"></div>${m.name} (${Math.round((m.totalCost/globalCost)*100)}%)</div>`).join('')}</div>
          </div>` : ''}
          <h3>Material Summaries & Inventory</h3>
          <table>
            <tr><th>Material</th><th>Total Qty</th><th>Total Cost</th><th>Paid</th><th style="text-align: right;">Status</th></tr>
            ${activeMats.map(m => {
              const b = m.totalCost - m.totalPaid; const s = b < 0;
              return `<tr><td><b style="color:${m.color}">${m.name.toUpperCase()}</b></td><td class="text-blue">${m.totalQty.toLocaleString('en-IN')} ${m.unit || ''}</td><td>₹${m.totalCost.toLocaleString('en-IN')}</td><td class="text-green">₹${m.totalPaid.toLocaleString('en-IN')}</td><td style="text-align: right;" class="${s ? 'text-green' : (b>0 ? 'text-red' : '')}"><b>${s ? 'ADVANCE: ' : (b>0 ? 'DUE: ' : '')}${s ? '+' : ''}₹${Math.abs(b).toLocaleString('en-IN')}</b></td></tr>`
            }).join('')}
          </table>
          <h3>Complete Transaction Log</h3>
          <table>
            <tr><th>Date & Time</th><th>Type</th><th>Material</th><th>Vendor</th><th>Quantity</th><th style="text-align: right;">Amount</th></tr>
            ${transactions.map(tx => {
              const c = categories[tx.categoryId] || { name: 'Unknown', color: '#94a3b8' }; const e = tx.type === 'expense';
              const d = new Date(tx.date); const ds = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' &bull; ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' });
              return `<tr><td class="text-muted" style="font-size: 11px;">${ds.toUpperCase()}</td><td><b class="${e ? 'text-red' : 'text-green'}">${e ? 'EXPENSE' : 'PAYMENT'}</b></td><td><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:${c.color}; margin-right:6px;"></span><b>${c.name.toUpperCase()}</b></td><td class="text-muted">${tx.vendor || '-'}</td><td class="text-blue">${tx.quantity || '-'} ${c.unit || ''}</td><td class="mono ${e ? 'text-red' : 'text-green'}" style="text-align: right;">${e ? '' : '+'}₹${tx.amount.toLocaleString('en-IN')}</td></tr>`
            }).join('')}
          </table>
        </div>
      </body>
      </html>
    `
    printWindow.document.write(html); printWindow.document.close(); printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
  }

  const cardStyle   = isDarkMode ? 'bg-slate-900 border-slate-800/70 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800'
  const subtle = isDarkMode ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className="space-y-6 pb-24">

      {/* ── Active Project ── */}
      <div className="space-y-3">
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ml-1 ${subtle}`}>Active Project</h3>
        <div className="flex gap-2">
          <select
            value={activeProject}
            onChange={(e) => {
              if (e.target.value === 'NEW') {
                const name = window.prompt('Enter new project name:'); 
                if (name && name.trim()) {
                  // Ensure we add it to the DB if it's genuinely new
                  db.projects.add({ name: name.trim() }).catch(()=>{}) 
                  switchProject(name.trim())
                }
              } else { switchProject(e.target.value) }
            }}
            className={`flex-1 p-4 rounded-xl outline-none font-bold text-sm border shadow-sm ${cardStyle}`}
          >
            {projects.map(p => <option key={p} value={p}>{String(p).toUpperCase()}</option>)}
            <option value="NEW" className="text-blue-500">+ CREATE NEW PROJECT…</option>
          </select>
          <button onClick={handleRenameCurrent} className={`p-4 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}>
            <Pencil size={18} />
          </button>
        </div>
      </div>

      {/* ── NEW: Cloud Backup Section ── */}
      <div className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden transition-all ${
        isDarkMode ? 'bg-slate-900 border-blue-500/20' : 'bg-white border-blue-100 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <RefreshCw size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Cloud Sync</h3>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${subtle}`}>
                {syncStatus === 'syncing' ? 'Syncing...' : (lastSync ? `Last Sync: ${lastSync}` : 'Backup to Google Drive')}
              </p>
            </div>
          </div>
          {syncStatus === 'success' && <CheckCircle2 className="text-emerald-500" size={20} />}
          {syncStatus === 'error' && <AlertCircle className="text-rose-500" size={20} />}
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            onClick={() => loginForSync()}
            disabled={syncStatus === 'syncing'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all text-[11px] uppercase tracking-widest"
          >
            <CloudUpload size={18} /> Backup to Drive
          </button>
          <button
            onClick={() => loginForRestore()}
            disabled={syncStatus === 'syncing'}
            className={`w-full font-black py-4 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[11px] uppercase tracking-widest border ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <CloudDownload size={18} /> Restore from Cloud
          </button>
        </div>
      </div>

      {/* ── Materials Management ── */}
      <div className="space-y-3">
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ml-1 ${subtle}`}>Materials</h3>
        <div className="space-y-2">
          {Object.values(categories).map(cat => (
            <div key={cat.id} className={`p-3.5 rounded-xl border flex items-center justify-between shadow-sm ${cardStyle}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => handleCycleColor(cat.id)} className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md active:scale-90" style={{ backgroundColor: cat.color }}><RefreshCw size={13} /></button>
                <div className="flex flex-col">
                  <p className="font-bold uppercase tracking-tight text-sm">{cat.name}</p>
                  {cat.unit && <span className="text-[9px] font-bold uppercase text-blue-500">{cat.unit}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(cat.id)} className={`p-2 rounded-lg ${subtle} hover:text-rose-500`}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Offline Exports ── */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleExportCSV} className="bg-emerald-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest">
          <FileText size={16} /> Excel CSV
        </button>
        <button onClick={handleExportPDF} className="bg-rose-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 text-[10px] uppercase tracking-widest">
          <Printer size={16} /> Print PDF
        </button>
      </div>

      {/* ── Manual Import ── */}
      <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`w-full py-7 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 active:scale-95 transition-all ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50 text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'
        }`}
      >
        <FileJson size={28} className="text-blue-500 opacity-50" />
        <span className="text-[10px] font-black uppercase tracking-widest">Import Offline JSON</span>
      </button>
    </div>
  )
}

// Minimal Internal Icons for status
function CloudUpload(p){return <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>}
function CloudDownload(p){return <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>}
function CheckCircle2(p){return <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>}
function AlertCircle(p){return <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>}