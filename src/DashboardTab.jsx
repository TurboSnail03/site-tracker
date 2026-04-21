import { useMemo } from 'react'

export default function DashboardTab({ transactions, categories, onCardClick }) {
  const materialData = useMemo(() => {
    const mats = {}
    Object.values(categories).forEach(cat => {
      mats[cat.id] = { ...cat, expense: 0, paid: 0, remaining: 0 }
    })
    transactions.forEach(tx => {
      if (!mats[tx.categoryId]) return
      if (tx.type === 'expense') mats[tx.categoryId].expense += tx.amount
      else mats[tx.categoryId].paid += tx.amount
      mats[tx.categoryId].remaining = Math.max(0, mats[tx.categoryId].expense - mats[tx.categoryId].paid)
    })
    return Object.values(mats).filter(m => m.expense > 0).sort((a, b) => b.remaining - a.remaining)
  }, [transactions, categories])

  if (materialData.length === 0) return (
    <div className="text-center py-24 bg-white/40 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-amber-200/50 dark:border-slate-800">
      <p className="text-amber-900/40 font-black uppercase tracking-widest text-[10px] italic">No active logs</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black text-amber-900/30 dark:text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Material Debts</h3>
      {materialData.map(mat => {
        const percentPaid = Math.min(Math.round((mat.paid / mat.expense) * 100), 100)
        return (
          <button 
            key={mat.id} onClick={() => onCardClick(mat.id)}
            className="group relative w-full text-left bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-amber-100/50 dark:border-slate-800 shadow-sm transition-all active:scale-[0.96] hover:border-blue-500/30"
          >
            <div className="absolute inset-y-0 left-0 bg-emerald-500/10 dark:bg-emerald-500/20 transition-all duration-1000" style={{ width: `${percentPaid}%` }} />
            <div className="absolute bottom-0 left-0 h-[3px] bg-emerald-500 transition-all duration-1000" style={{ width: `${percentPaid}%` }} />
            <div className="relative p-5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ backgroundColor: mat.color }}>{mat.name.charAt(0)}</div>
                <div>
                  <p className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{mat.name}</p>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-tighter">{percentPaid}% CLEARED</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-rose-500 dark:text-rose-400 tracking-tighter">₹{mat.remaining.toLocaleString()}</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Tap to log</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}