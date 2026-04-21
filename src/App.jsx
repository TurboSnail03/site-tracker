import { useState, useEffect, useMemo } from 'react'
import { PlusCircle, LayoutDashboard, List, Settings, Sun, Moon, UploadCloud } from 'lucide-react'
import SetupTab from './SetupTab'
import TransactionModal from './TransactionModal'
import LogTab from './LogTab'
import DashboardTab from './DashboardTab'

export default function App() {
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('siteCategories')) || {})
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('siteTransactions')) || [])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCatId, setSelectedCatId] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('siteTheme') === 'dark')
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => localStorage.setItem('siteCategories', JSON.stringify(categories)), [categories])
  useEffect(() => localStorage.setItem('siteTransactions', JSON.stringify(transactions)), [transactions])
  
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('siteTheme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const processImport = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (parsed.categories && parsed.transactions) {
          if (window.confirm("Overwrite current data?")) {
            setCategories(parsed.categories); setTransactions(parsed.transactions);
          }
        }
      } catch (err) { alert("Invalid file.") }
    }
    reader.readAsText(file)
  }

  const handleAddTransaction = (newTx, newCat = null) => {
    if (newCat) setCategories(prev => ({ ...prev, [newCat.id]: newCat }))
    setTransactions(prev => [newTx, ...prev])
    if (window.navigator.vibrate) window.navigator.vibrate(50)
  }

  const globalStats = useMemo(() => {
    let expense = 0, paid = 0;
    transactions.forEach(tx => {
      tx.type === 'expense' ? expense += tx.amount : paid += tx.amount
    })
    return { expense, paid, remaining: Math.max(0, expense - paid) }
  }, [transactions])

  return (
    <div 
      className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors overflow-hidden relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); processImport(e.dataTransfer.files[0]); }}
    >
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-blue-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white font-black p-10 text-center">
          <UploadCloud size={64} className="mb-4 animate-bounce" />
          <h2 className="text-3xl italic uppercase tracking-tighter">Drop to Sync</h2>
        </div>
      )}

      {/* HEADER: Original Dark Look */}
      <header className="bg-slate-900 text-white p-5 pt-8 flex justify-between items-center shrink-0 shadow-2xl z-40">
        <h1 className="text-xl font-black tracking-tighter italic">SITE<span className="text-blue-500">TRACKER</span></h1>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700 active:scale-90 transition-transform">
          {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-300" />}
        </button>
      </header>

      {/* SCROLLABLE MAIN: Exact layout from screenshot */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-md mx-auto p-4 pb-40">
          {activeTab === 'dashboard' && (
            <>
              {/* SUMMARY CARD: Restored exactly as in your 'Old Look' screenshot */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 mb-8">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Balance Due</p>
                <h2 className="text-6xl font-black text-rose-500 tracking-tighter mb-10">₹{globalStats.remaining.toLocaleString()}</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-[1.8rem]">
                    <p className="text-[9px] font-black opacity-40 dark:text-slate-400 uppercase mb-1">Total Cost</p>
                    <p className="font-black text-slate-700 dark:text-slate-200 text-lg">₹{globalStats.expense.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-[1.8rem]">
                    <p className="text-[9px] font-black text-emerald-600/60 uppercase mb-1">Total Paid</p>
                    <p className="font-black text-emerald-600 text-lg">₹{globalStats.paid.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <DashboardTab 
                transactions={transactions} 
                categories={categories} 
                onCardClick={(id) => { setSelectedCatId(id); setIsModalOpen(true); }} 
              />
            </>
          )}

          {activeTab === 'log' && <LogTab transactions={transactions} categories={categories} setTransactions={setTransactions} />}
          {activeTab === 'setup' && <SetupTab categories={categories} setCategories={setCategories} transactions={transactions} setTransactions={setTransactions} processImport={processImport} />}
        </div>
      </main>

      {/* FAB: Restored Border Color */}
      <button 
        onClick={() => { setSelectedCatId(''); setIsModalOpen(true); }} 
        className="fixed bottom-28 right-6 bg-blue-600 text-white w-16 h-16 rounded-[2.2rem] shadow-[0_15px_40px_rgba(37,99,235,0.4)] flex items-center justify-center active:scale-75 transition-all z-50 border-4 border-slate-50 dark:border-slate-950"
      >
        <PlusCircle size={32} strokeWidth={2.5} />
      </button>

      {/* NAVIGATION: Restored exact style */}
      <nav className="fixed bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex justify-around p-4 pb-10 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[ 
          {id: 'dashboard', icon: LayoutDashboard, label: 'Stats'}, 
          {id: 'log', icon: List, label: 'Log'}, 
          {id: 'setup', icon: Settings, label: 'Sync'} 
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1.5 px-6 py-1 rounded-2xl transition-all ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categories={categories} 
        initialCatId={selectedCatId} 
        onAddTransaction={handleAddTransaction} 
      />
    </div>
  )
}