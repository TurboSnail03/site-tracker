import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle, LayoutDashboard, List, Settings, Sun, Moon, UploadCloud } from 'lucide-react'
import SetupTab from './SetupTab'
import TransactionModal from './TransactionModal'
import LogTab from './LogTab'
import DashboardTab from './DashboardTab'

// FIX #4: Moved outside component — no longer recreated on every render
const getSafeData = (key, fallback) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch (e) { return fallback }
}

export default function App() {
  // 1. PROJECT POINTER
  const [activeProject, setActiveProject] = useState(
    () => localStorage.getItem('siteActiveProject') || 'Site A'
  )

  // 2. DATA STATES (Scoped to active project)
  const [categories, setCategories] = useState(
    () => getSafeData(`siteCategories_${localStorage.getItem('siteActiveProject') || 'Site A'}`, {})
  )
  const [transactions, setTransactions] = useState(
    () => getSafeData(`siteTransactions_${localStorage.getItem('siteActiveProject') || 'Site A'}`, [])
  )

  const [activeTab, setActiveTab] = useState('dashboard')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCatId, setSelectedCatId] = useState('')
  const [modalAmount, setModalAmount] = useState('')
  const [modalType, setModalType] = useState('expense')

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('siteTheme') === 'dark'
  )
  const [isDragging, setIsDragging] = useState(false)

  // FIX #1: Sync effect only handles incremental data changes — NOT project switching.
  // activeProject is intentionally excluded from the dependency array here.
  // Project switching and renaming persist data themselves before mutating state.
  useEffect(() => {
    localStorage.setItem(`siteCategories_${activeProject}`, JSON.stringify(categories))
    localStorage.setItem(`siteTransactions_${activeProject}`, JSON.stringify(transactions))
  }, [categories, transactions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Theme Engine
  useEffect(() => {
    const root = window.document.documentElement
    isDarkMode ? root.classList.add('dark') : root.classList.remove('dark')
    localStorage.setItem('siteTheme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // FIX #1: handleProjectSwitch now explicitly saves current project data BEFORE
  // switching state, eliminating the race condition where the sync useEffect
  // could fire mid-switch with a mismatched activeProject/categories pair.
  const handleProjectSwitch = (projectName) => {
    // Persist current project first
    localStorage.setItem(`siteCategories_${activeProject}`, JSON.stringify(categories))
    localStorage.setItem(`siteTransactions_${activeProject}`, JSON.stringify(transactions))

    // Now load and apply the new project
    const newCats = getSafeData(`siteCategories_${projectName}`, {})
    const newTxs  = getSafeData(`siteTransactions_${projectName}`, [])

    localStorage.setItem('siteActiveProject', projectName)
    setActiveProject(projectName)
    setCategories(newCats)
    setTransactions(newTxs)
  }

  // FIX #1 + FIX #2: Rename now guards against duplicate project names (silent
  // overwrite) and explicitly persists data rather than relying on the effect.
  const handleProjectRename = (oldName, newName) => {
    if (!newName || newName.trim() === '' || oldName === newName) return
    const cleanNewName = newName.trim()

    // FIX #2: Conflict guard — prevents silent overwrite of existing project
    if (localStorage.getItem(`siteCategories_${cleanNewName}`) !== null) {
      alert(`A project named "${cleanNewName}" already exists. Choose a different name.`)
      return
    }

    // 1. Write current in-memory data to the new key
    localStorage.setItem(`siteCategories_${cleanNewName}`, JSON.stringify(categories))
    localStorage.setItem(`siteTransactions_${cleanNewName}`, JSON.stringify(transactions))

    // 2. Clear old keys
    localStorage.removeItem(`siteCategories_${oldName}`)
    localStorage.removeItem(`siteTransactions_${oldName}`)

    // 3. Update pointer and React state
    localStorage.setItem('siteActiveProject', cleanNewName)
    setActiveProject(cleanNewName)
  }

  const processImport = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (parsed.categories && parsed.transactions) {
          if (window.confirm(`Overwrite data for project: ${activeProject}?`)) {
            setCategories(parsed.categories)
            setTransactions(parsed.transactions)
          }
        }
      } catch (err) { alert('Invalid backup file.') }
    }
    reader.readAsText(file)
  }

  const handleAddTransaction = (newTx, newCat = null) => {
    if (newCat) setCategories(prev => ({ ...prev, [newCat.id]: newCat }))
    setTransactions(prev => [newTx, ...prev])
    if (window.navigator.vibrate) window.navigator.vibrate(50)
  }

  const globalStats = useMemo(() => {
    let expense = 0, paid = 0
    const txList = Array.isArray(transactions) ? transactions : []
    txList.forEach(tx => tx.type === 'expense' ? expense += tx.amount : paid += tx.amount)
    return { expense, paid, remaining: Math.max(0, expense - paid) }
  }, [transactions])

  const appStyles = {
    bg:          isDarkMode ? 'bg-[#0f172a]'                          : 'bg-slate-50',
    cardBg:      isDarkMode ? 'bg-slate-900'                          : 'bg-white',
    cardBorder:  isDarkMode ? 'border-slate-800/70'                   : 'border-slate-200/80',
    statBoxBg:   isDarkMode ? 'bg-slate-800/50'                       : 'bg-slate-50',
    shadow:      isDarkMode ? 'shadow-black/40'                       : 'shadow-slate-200',
    navBg:       isDarkMode ? 'bg-slate-900/95 border-slate-800/60'   : 'bg-white/95 border-slate-200/60',
    text:        isDarkMode ? 'text-slate-100'                        : 'text-slate-800',
    textSubtle:  isDarkMode ? 'text-slate-500'                        : 'text-slate-400',
    fabBorder:   isDarkMode ? 'border-[#0f172a]'                      : 'border-slate-50',
  }

  const paidPct = globalStats.expense > 0
    ? Math.min((globalStats.paid / globalStats.expense) * 100, 100)
    : 0

  return (
    <div
      className={`h-screen-safe w-full flex flex-col transition-colors duration-300 overflow-hidden relative ${appStyles.bg} ${appStyles.text}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={(e) => { if (e.relatedTarget === null) setIsDragging(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        processImport(e.dataTransfer.files[0])
      }}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-blue-600/95 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-6 animate-bounce">
            <UploadCloud size={40} />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Drop to Import</h2>
          <p className="text-sm text-blue-200 mt-2 font-medium tracking-wide">Release to sync your backup file</p>
        </div>
      )}

      {/* Header — header-safe pads around notch/Dynamic Island/status bar */}
      <header className="header-safe bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white px-5 flex justify-between items-center shrink-0 shadow-xl shadow-black/25 z-40">
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none">
            SITE<span className="text-blue-400">TRACKER</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.25em]">
              {activeProject}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="touch-target rounded-xl bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700 active:scale-90 transition-all"
        >
          {isDarkMode
            ? <Sun  size={18} className="text-yellow-400" />
            : <Moon size={18} className="text-blue-300" />}
        </button>
      </header>

      {/* Main Content with AnimatePresence tab transitions */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-md mx-auto p-4 main-scroll-pad"
          >
            {activeTab === 'dashboard' && (
              <>
                {/* Hero Balance Card */}
                <div className={`rounded-2xl p-5 shadow-lg border mb-5 relative transition-colors duration-300 ${appStyles.cardBg} ${appStyles.cardBorder}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.25em] mb-1 ${appStyles.textSubtle}`}>
                    Balance Due
                  </p>
                  <h2 className="text-5xl font-black text-rose-500 tracking-tighter leading-none mt-1">
                    ₹{globalStats.remaining.toLocaleString()}
                  </h2>

                  {/* Overall progress bar */}
                  {globalStats.expense > 0 && (
                    <div className={`mt-4 h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  )}

                  <div className={`grid grid-cols-2 gap-3 mt-4 pt-4 border-t ${appStyles.cardBorder}`}>
                    <div className={`p-3 rounded-xl ${appStyles.statBoxBg}`}>
                      <p className={`text-[9px] font-semibold uppercase tracking-widest mb-1 ${appStyles.textSubtle}`}>
                        Total Cost
                      </p>
                      <p className={`font-black text-sm ${appStyles.text}`}>
                        ₹{globalStats.expense.toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${appStyles.statBoxBg} border border-emerald-500/10`}>
                      <p className="text-[9px] font-semibold text-emerald-500 uppercase tracking-widest mb-1">
                        Total Paid
                      </p>
                      <p className="font-black text-sm text-emerald-500">
                        ₹{globalStats.paid.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <DashboardTab
                  isDarkMode={isDarkMode}
                  transactions={transactions}
                  categories={categories}
                  onCardClick={(id, amount = '', type = 'payment') => {
                    setSelectedCatId(id)
                    setModalAmount(amount)
                    setModalType(type)
                    setIsModalOpen(true)
                  }}
                />
              </>
            )}

            {activeTab === 'log' && (
              <LogTab
                isDarkMode={isDarkMode}
                transactions={transactions}
                categories={categories}
                setTransactions={setTransactions}
              />
            )}

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
                renameProject={handleProjectRename}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB — Add Transaction */}
      <motion.button
        onClick={() => {
          setSelectedCatId('')
          setModalAmount('')
          setModalType('expense')
          setIsModalOpen(true)
        }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`fab-safe fixed right-5 bg-blue-600 text-white w-[60px] h-[60px] rounded-2xl shadow-[0_8px_30px_rgba(37,99,235,0.55)] flex items-center justify-center z-50 border-4 ${appStyles.fabBorder}`}
      >
        <PlusCircle size={28} strokeWidth={2.5} />
      </motion.button>

      {/* Bottom Navigation */}
      <nav className={`nav-safe fixed bottom-0 w-full backdrop-blur-2xl flex justify-around px-4 z-40 border-t transition-colors duration-300 ${appStyles.navBg}`}>
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
          { id: 'log',       icon: List,            label: 'Log'   },
          { id: 'setup',     icon: Settings,         label: 'Sync'  },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex flex-col items-center gap-1 px-7 py-3 min-h-[44px]"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-blue-600/10 rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <tab.icon
              size={20}
              strokeWidth={activeTab === tab.id ? 2.5 : 1.75}
              className={`relative z-10 transition-colors duration-200 ${activeTab === tab.id ? 'text-blue-600' : appStyles.textSubtle}`}
            />
            <span className={`relative z-10 text-[9px] font-bold uppercase tracking-widest transition-colors duration-200 ${activeTab === tab.id ? 'text-blue-600' : appStyles.textSubtle}`}>
              {tab.label}
            </span>
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
