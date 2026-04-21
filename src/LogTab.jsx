import { useState } from 'react'
import { Trash2, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react'

export default function LogTab({ transactions, categories, setTransactions }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') 

  const handleDelete = (id) => {
    if (window.confirm("Delete this transaction?")) {
      setTransactions(transactions.filter(tx => tx.id !== id))
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    const cat = categories[tx.categoryId] || { name: '' }
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase()) || 
                          (tx.vendor && tx.vendor.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || tx.type === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-4 pb-20">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search material or vendor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'expense', 'payment'].map(type => (
            <button 
              key={type}
              onClick={() => setFilter(type)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* The List */}
      <div className="space-y-3">
        {filteredTransactions.map(tx => {
          const cat = categories[tx.categoryId] || { name: 'Unknown' }
          const isExpense = tx.type === 'expense'
          return (
            <div key={tx.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpense ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                  {isExpense ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>
                <div>
                  <p className="font-black text-slate-800 dark:text-white leading-tight uppercase text-xs tracking-tight">{cat.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{tx.date} {tx.vendor && `• ${tx.vendor}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-black text-sm ${isExpense ? 'text-slate-800 dark:text-gray-200' : 'text-emerald-600'}`}>
                  {isExpense ? '' : '+'}₹{tx.amount.toLocaleString()}
                </p>
                <button onClick={() => handleDelete(tx.id)} className="text-slate-200 hover:text-rose-500 active:scale-75 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 text-slate-400 font-black uppercase tracking-widest text-[10px] italic">No records found</div>
        )}
      </div>
    </div>
  )
}