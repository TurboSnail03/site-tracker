import { useState } from 'react'
import { Trash2, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react'

export default function LogTab({ isDarkMode, transactions, categories, setTransactions }) {
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all')
  const [timeFilter, setTimeFilter]   = useState('all')

  // FIX #3: Use functional updater (prev =>) to avoid stale closure.
  // Previously `transactions` was captured at render time, meaning a second
  // rapid delete would work from a stale array and silently undo the first.
  const handleDelete = (id) => {
    if (window.confirm('Delete this transaction?')) {
      setTransactions(prev => prev.filter(tx => tx.id !== id))
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    const cat = categories[tx.categoryId] || { name: '' }
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      (tx.vendor && tx.vendor.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || tx.type === filter

    // FIX #12: Anchored to start-of-day boundaries to prevent floating-point
    // off-by-one. Previously `<= 7` could include or exclude transactions
    // inconsistently depending on the time of day.
    let matchesTime = true
    if (timeFilter !== 'all') {
      const txDate = new Date(tx.date)
      const now    = new Date()

      if (timeFilter === 'month') {
        matchesTime =
          txDate.getMonth()     === now.getMonth() &&
          txDate.getFullYear()  === now.getFullYear()
      } else if (timeFilter === 'week') {
        // Anchor both ends to midnight so comparisons are day-clean
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const sevenDaysAgo = new Date(startOfToday)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        matchesTime = txDate >= sevenDaysAgo && txDate <= now
      }
    }

    return matchesSearch && matchesFilter && matchesTime
  })

  const formatDateTime = (dateStr) => {
    const dateObj = new Date(dateStr)
    const date = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    const time = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${date} • ${time}`.toUpperCase()
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Search & Filter Bar */}
      <div className={`p-4 rounded-[2rem] shadow-xl border space-y-3 transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100'
      }`}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search material or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none font-bold text-sm transition-colors ${
              isDarkMode ? 'bg-slate-800 text-white' : 'bg-amber-50/50 text-slate-800'
            }`}
          />
        </div>

        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className={`w-full p-3 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer transition-colors ${
            isDarkMode ? 'bg-slate-800 text-white' : 'bg-amber-50/50 text-slate-800'
          }`}
        >
          <option value="all">Time: All Time</option>
          <option value="month">Time: This Month</option>
          <option value="week">Time: Past 7 Days</option>
        </select>

        <div className="flex gap-2">
          {['all', 'expense', 'payment'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === type
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-amber-50 text-amber-900/40')
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* The List */}
      <div className="space-y-3">
        {filteredTransactions.map(tx => {
          const cat       = categories[tx.categoryId] || { name: 'Unknown' }
          const isExpense = tx.type === 'expense'
          return (
            <div
              key={tx.id}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isExpense ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {isExpense ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>
                <div>
                  <p className={`font-black leading-tight uppercase text-xs tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}>
                    {cat.name}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                    {formatDateTime(tx.date)}{tx.vendor && ` • ${tx.vendor}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-black text-sm ${
                  isExpense
                    ? (isDarkMode ? 'text-slate-200' : 'text-slate-800')
                    : 'text-emerald-600'
                }`}>
                  {isExpense ? '' : '+'}₹{tx.amount.toLocaleString()}
                </p>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="text-slate-300 hover:text-rose-500 active:scale-75 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest text-[10px] italic">
            No records found
          </div>
        )}
      </div>
    </div>
  )
}
