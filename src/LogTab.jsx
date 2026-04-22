import { useState } from 'react'
import { Trash2, ArrowUpRight, ArrowDownLeft, Search, Package } from 'lucide-react'

export default function LogTab({ isDarkMode, transactions, categories, setTransactions }) {
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')

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

    let matchesTime = true
    if (timeFilter !== 'all') {
      const txDate = new Date(tx.date)
      const now    = new Date()

      if (timeFilter === 'month') {
        matchesTime =
          txDate.getMonth()    === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
      } else if (timeFilter === 'week') {
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

  const inputBg  = isDarkMode ? 'bg-slate-800 text-slate-100'  : 'bg-slate-50 text-slate-800'
  const subtle   = isDarkMode ? 'text-slate-500'               : 'text-slate-400'
  const cardBase = isDarkMode ? 'bg-slate-900 border-slate-800/70' : 'bg-white border-slate-200/80'

  return (
    <div className="space-y-3 pb-20">

      {/* ── Search & Filter Card ──────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border shadow-sm space-y-3 ${cardBase}`}>
        <div className="relative">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${subtle}`} size={16} />
          <input
            type="text"
            placeholder="Search material or vendor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm font-medium transition-colors ${inputBg}`}
          />
        </div>

        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className={`w-full p-2.5 rounded-xl outline-none text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${inputBg}`}
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
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === type
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction List ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filteredTransactions.map(tx => {
          const cat       = categories[tx.categoryId] || { name: 'Unknown', color: '#94a3b8' }
          const isExpense = tx.type === 'expense'
          
          return (
            <div
              key={tx.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${cardBase}`}
            >
              <div className="flex items-center gap-3">
                {/* Type icon badge */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isExpense 
                    ? (isDarkMode ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-500') 
                    : (isDarkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600')
                }`}>
                  {isExpense
                    ? <ArrowUpRight size={18} strokeWidth={2.5} />
                    : <ArrowDownLeft size={18} strokeWidth={2.5} />}
                </div>

                <div>
                  {/* Category dot + name + QUANTITY PILL */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <p className={`font-bold text-xs uppercase tracking-tight leading-tight ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        {cat.name}
                      </p>
                    </div>
                    
                    {/* NEW: Transaction Quantity Pill */}
                    {tx.quantity && (
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${
                        isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Package size={10} strokeWidth={2.5} />
                        {tx.quantity.toLocaleString()} {cat.unit || 'Qty'}
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-[9px] font-medium mt-1 ${subtle}`}>
                    {formatDateTime(tx.date)}{tx.vendor && ` · ${tx.vendor}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <p className={`font-black text-sm tracking-tight ${
                  isExpense ? 'text-rose-500' : 'text-emerald-500'
                }`}>
                  {isExpense ? '' : '+'}₹{tx.amount.toLocaleString()}
                </p>
                
                <button
                  onClick={() => handleDelete(tx.id)}
                  className={`p-1.5 rounded-lg transition-all active:scale-75 ${subtle} hover:text-rose-500 hover:bg-rose-50`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}

        {filteredTransactions.length === 0 && (
          <div className={`text-center py-16 text-[10px] font-bold uppercase tracking-widest ${subtle}`}>
            No records found
          </div>
        )}
      </div>
    </div>
  )
}