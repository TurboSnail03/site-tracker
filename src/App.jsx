import { useState, useEffect, useMemo } from 'react'
import { PlusCircle, LayoutDashboard, List, Settings, Sun, Moon, UploadCloud } from 'lucide-react'
import SetupTab from './SetupTab'
import TransactionModal from './TransactionModal'
import LogTab from './LogTab'
import DashboardTab from './DashboardTab'

export default function App() {
  const [activeProject, setActiveProject] = useState(() => localStorage.getItem('siteActiveProject') || 'Site A')

  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem(`siteCategories_${localStorage.getItem('siteActiveProject') || 'Site A'}`)) || {})
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem(`siteTransactions_${localStorage.getItem('siteActiveProject') || 'Site A'}`)) || [])
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCatId, setSelectedCatId] = useState('')
  const [modalAmount, setModalAmount] = useState('')
  const [modalType, setModalType] = useState('expense')
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('siteTheme')
    return saved ? saved === 'dark' : true 
  })

  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => localStorage.setItem(`siteCategories_${activeProject}`, JSON.stringify(categories)), [categories, activeProject])
  useEffect(() => localStorage.setItem(`siteTransactions_${activeProject}`, JSON.stringify(transactions)), [transactions, activeProject])
  
  useEffect(() => {
    const root = window.document.documentElement
    if (isDarkMode) root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('siteTheme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const handleProjectSwitch = (projectName) => {
    setActiveProject(projectName)
    localStorage.setItem('siteActiveProject', projectName)
    setCategories(JSON.parse(localStorage.getItem(`siteCategories_${projectName}`)) || {})
    setTransactions(JSON.parse(localStorage.getItem(`siteTransactions_${projectName}`)) || [])
  }

  // NEW: Rename Engine
  const handleProjectRename = (oldName, newName) => {
    if (!newName || newName.trim() === '' || oldName === newName) return;
    const cleanNewName = newName.trim();

    // Move data in localStorage
    localStorage.setItem(`siteCategories_${cleanNewName}`, JSON.stringify(categories));
    localStorage.setItem(`siteTransactions_${cleanNewName}`, JSON.stringify(transactions));

    // Delete old keys
    localStorage.removeItem(`siteCategories_${oldName}`);
    localStorage.removeItem(`siteTransactions_${oldName}`);

    // Update state and active project pointer
    setActiveProject(cleanNewName);
    localStorage.setItem('siteActiveProject', cleanNewName);
  };

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

  const appStyles = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-[#FBEDD0]',
    cardBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    cardBorder: isDarkMode ? 'border-slate-800' : 'border-amber-100/50',
    statBoxBg: isDarkMode ? 'bg-slate-800/60' : 'bg-amber-50/50',
    shadow: isDarkMode ? 'shadow-black/50' : 'shadow-amber-900/10',
    navBg: isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-[#FBEDD0]/95 border-amber-100/50',
    text: isDarkMode ? 'text-slate-200' : 'text-slate-700',
    textSubtle: isDarkMode ? 'text-slate-400' : 'text-amber-900/40',
    fabBorder: isDarkMode ? 'border-slate-950' : 'border-[#FBEDD0]',
  }

  return (
    <div 
      className={`h-screen flex flex-col transition-colors duration-300 overflow-hidden relative ${appStyles.bg} ${appStyles.text}`}
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

      <header className="bg-slate-900 text-white p-5 pt-8 flex justify-between items-center shrink-0 shadow-2xl z-40">
        <div>
          <h1 className="text-xl font-black tracking-tighter italic uppercase">SITE<span className="text-blue-500">TRACKER</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeProject}</p>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700 active:scale-90 transition-transform">
          {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-300" />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-md mx-auto p-4 pb-40">
          {activeTab === 'dashboard' && (
            <>
              <div className={`rounded-[2.5rem] p-8 shadow-2xl border mb-8 relative overflow-hidden transition-colors duration-300 ${appStyles.cardBg} ${appStyles.cardBorder} ${appStyles.shadow}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${appStyles.textSubtle}`}>Balance Due</p>
                <h2 className={`text-5xl font-black text-rose-500 ${isDarkMode ? 'dark:text-rose-400' : ''} tracking-tighter`}>₹{globalStats.remaining.toLocaleString()}</h2>
                
                <div className={`grid grid-cols-2 gap-4 mt-8 pt-6 border-t ${appStyles.cardBorder}`}>
                  <div className={`p-4 rounded-3xl ${appStyles.statBoxBg}`}>
                    <p className={`text-[9px] font-black uppercase mb-1 opacity-60 dark:opacity-80 ${appStyles.textSubtle}`}>Total Cost</p>
                    <p className={`font-black ${appStyles.text}`}>₹{globalStats.expense.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-3xl ${appStyles.statBoxBg} border border-emerald-100/20 dark:border-emerald-900/20`}>
                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1 opacity-80">Total Paid</p>
                    <p className="font-black text-emerald-600 dark:text-emerald-400">₹{globalStats.paid.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <DashboardTab 
                isDarkMode={isDarkMode}
                transactions={transactions} 
                categories={categories} 
                onCardClick={(id, amount = '', type = 'payment') => { 
                  setSelectedCatId(id); 
                  setModalAmount(amount);
                  setModalType(type);
                  setIsModalOpen(true); 
                }} 
              />
            </>
          )}

          {activeTab === 'log' && <LogTab isDarkMode={isDarkMode} transactions={transactions} categories={categories} setTransactions={setTransactions} />}
          
          {activeTab === 'setup' && (
            <SetupTab 
              isDarkMode={isDarkMode} 
              categories={categories} 
              setCategories={setCategories} 
              transactions={transactions} 
              setTransactions={setTransactions} 
              processImport={processImport} 
              activeProject={activeProject}
              switchProject={handleProjectSwitch}
              renameProject={handleProjectRename} // NEW
            />
          )}
        </div>
      </main>

      <button 
        onClick={() => { setSelectedCatId(''); setModalAmount(''); setModalType('expense'); setIsModalOpen(true); }} 
        className={`fixed bottom-28 right-6 bg-blue-600 text-white w-16 h-16 rounded-[2.2rem] shadow-[0_15px_40_rgba(37,99,235,0.4)] flex items-center justify-center active:scale-75 transition-all z-50 border-4 ${appStyles.fabBorder}`}
      >
        <PlusCircle size={32} strokeWidth={2.5} />
      </button>

      <nav className={`fixed bottom-0 w-full backdrop-blur-xl flex justify-around p-4 pb-10 z-40 shadow-[0_-10px_40_rgba(139,69,19,0.05)] transition-colors duration-300 ${appStyles.navBg}`}>
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
        isDarkMode={isDarkMode}
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categories={categories} 
        initialCatId={selectedCatId} 
        initialAmount={modalAmount} 
        initialType={modalType}     
        onAddTransaction={handleAddTransaction}
        transactions={transactions} 
      />
    </div>
  )
}