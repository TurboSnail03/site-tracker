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

  // NEW: Calculate total expense for the breakdown chart
  const totalExpense = useMemo(() => {
    return materialData.reduce((sum, mat) => sum + mat.expense, 0)
  }, [materialData])

  if (materialData.length === 0) return (
    <div className={`text-center py-24 rounded-[3rem] border-2 border-dashed ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white/40 border-amber-200/50'}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">No active logs</p>
    </div>
  )

  return (
    <div className="space-y-4">
      
      {/* Visual Cost Breakdown Chart */}
      {totalExpense > 0 && (
        <div className={`p-5 rounded-[2rem] border shadow-sm mb-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100'}`}>
          <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 italic opacity-40`}>Cost Breakdown</h3>
          
          {/* Segmented Bar */}
          <div className={`h-4 w-full flex rounded-full overflow-hidden mb-4 shadow-inner ${isDarkMode ? 'bg-slate-800' : 'bg-amber-50'}`}>
            {materialData.map(mat => (
              <div 
                key={`bar-${mat.id}`} 
                style={{ width: `${(mat.expense / totalExpense) * 100}%`, backgroundColor: mat.color }} 
                className="h-full transition-all duration-1000 hover:opacity-80"
              />
            ))}
          </div>
          
          {/* Legend (Top 4 Materials) */}
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {materialData.slice(0, 4).map(mat => {
              const pct = Math.round((mat.expense / totalExpense) * 100)
              return (
                <div key={`legend-${mat.id}`} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: mat.color }}></span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {mat.name} <span className="opacity-50">({pct}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Existing Material Debts List */}
      <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic opacity-40`}>Material Debts</h3>
      {materialData.map(mat => {
        const percentPaid = Math.min(Math.round((mat.paid / mat.expense) * 100), 100)
        return (
          <div 
            key={mat.id} 
            // The main card click functions exactly as it used to (opens standard log)
            onClick={() => onCardClick(mat.id)}
            className={`group cursor-pointer relative w-full text-left rounded-[2rem] overflow-hidden border transition-all active:scale-[0.98] shadow-sm ${
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
              <div className="text-right flex flex-col items-end gap-1.5">
                <p className="text-xl font-black text-rose-500 tracking-tighter">₹{mat.remaining.toLocaleString()}</p>
                
                {/* NEW: Dedicated separate button for settling up */}
                {mat.remaining > 0 ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Stops the main card click from firing
                      onCardClick(mat.id, mat.remaining, 'payment');
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-md active:scale-90 transition-all"
                  >
                    Settle Up
                  </button>
                ) : (
                  <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 opacity-40`}>All Cleared</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}