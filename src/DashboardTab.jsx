import { useMemo } from 'react'

export default function DashboardTab({ isDarkMode, transactions, categories, onCardClick }) {
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
    <div className={`text-center py-24 rounded-[3rem] border-2 border-dashed ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white/40 border-amber-200/50'}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">No active logs</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic opacity-40`}>Material Debts</h3>
      {materialData.map(mat => {
        const percentPaid = Math.min(Math.round((mat.paid / mat.expense) * 100), 100)
        return (
          <button 
            key={mat.id} 
            onClick={() => onCardClick(mat.id)}
            className={`group relative w-full text-left rounded-[2rem] overflow-hidden border transition-all active:scale-[0.96] shadow-sm ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 shadow-black/20' 
                : 'bg-white border-amber-100 shadow-amber-900/5'
            }`}
          >
            {/* Progress Background */}
            <div 
              className={`absolute inset-y-0 left-0 transition-all duration-1000 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`} 
              style={{ width: `${percentPaid}%` }} 
            />
            {/* Progress Bottom Bar */}
            <div 
              className="absolute bottom-0 left-0 h-[3px] bg-emerald-500 transition-all duration-1000" 
              style={{ width: `${percentPaid}%` }} 
            />
            
            <div className="relative p-5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg" style={{ backgroundColor: mat.color }}>
                  {mat.name.charAt(0)}
                </div>
                <div>
                  <p className={`font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{mat.name}</p>
                  <p className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter">{percentPaid}% CLEARED</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-rose-500 tracking-tighter">₹{mat.remaining.toLocaleString()}</p>
                <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 opacity-40`}>Tap to log</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}