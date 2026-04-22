import { useMemo, useState } from 'react'
import { Package, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

// ── SVG Progress Ring ──────────────────────────────────────────────────────
function ProgressRing({ percent, color, label, isDarkMode }) {
  const r        = 22
  const circ     = 2 * Math.PI * r
  const offset   = circ * (1 - Math.min(percent, 100) / 100)
  const trackClr = isDarkMode ? '#1e293b' : '#f1f5f9'

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0" aria-label={`${percent}% cleared`}>
      <circle cx="28" cy="28" r={r} fill="none" stroke={trackClr} strokeWidth="3" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="progress-ring-circle"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '28px 28px' }}
      />
      <circle cx="28" cy="28" r="15" fill={`${color}18`} />
      <text
        x="28" y="29"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        fill={color}
      >
        {label}
      </text>
    </svg>
  )
}

// ── FIXED: Now includes Full Year and Time (e.g. "22 APR 2026 • 07:15 AM") ──
const formatShortDate = (dateStr) => {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date} • ${time}`.toUpperCase()
}

export default function DashboardTab({ isDarkMode, transactions, categories, onCardClick }) {
  const [expandedId, setExpandedId] = useState(null)

  const materialData = useMemo(() => {
    const mats = {}
    Object.values(categories).forEach(cat => {
      mats[cat.id] = { ...cat, expense: 0, paid: 0, remaining: 0, totalQuantity: 0 }
    })
    
    transactions.forEach(tx => {
      if (!mats[tx.categoryId]) return
      
      if (tx.type === 'expense') {
        mats[tx.categoryId].expense += tx.amount
        if (tx.quantity) mats[tx.categoryId].totalQuantity += tx.quantity
      } else {
        mats[tx.categoryId].paid += tx.amount
      }
      
      mats[tx.categoryId].remaining = mats[tx.categoryId].expense - mats[tx.categoryId].paid
    })
    
    return Object.values(mats)
      .filter(m => m.expense > 0 || m.paid > 0)
      .sort((a, b) => Math.abs(b.remaining) - Math.abs(a.remaining))
  }, [transactions, categories])

  const totalExpense = useMemo(() => {
    return materialData.reduce((sum, mat) => sum + mat.expense, 0)
  }, [materialData])

  const card   = isDarkMode ? 'bg-slate-900 border-slate-800/70' : 'bg-white border-slate-200/80'
  const subtle = isDarkMode ? 'text-slate-500' : 'text-slate-400'

  if (materialData.length === 0) return (
    <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${
      isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50/60'
    }`}>
      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
          <path d="M3 3h7l2 3H21a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
        </svg>
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>No active logs</p>
      <p className={`text-[9px] mt-1 ${subtle} opacity-60`}>Add a transaction to get started</p>
    </div>
  )

  return (
    <div className="space-y-4">

      {totalExpense > 0 && (
        <div className={`p-5 rounded-2xl border shadow-sm ${card}`}>
          <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 ${subtle}`}>
            Cost Breakdown
          </h3>

          <div className={`h-3 w-full flex rounded-full overflow-hidden mb-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {materialData.map(mat => (
              <div
                key={`bar-${mat.id}`}
                style={{ width: `${(mat.expense / totalExpense) * 100}%`, backgroundColor: mat.color }}
                className="h-full transition-all duration-1000 hover:brightness-110"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {materialData.slice(0, 5).map(mat => {
              const pct = Math.round((mat.expense / totalExpense) * 100)
              return (
                <div key={`legend-${mat.id}`} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mat.color }} />
                  <span className={`text-[9px] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {mat.name} <span className="opacity-50">{pct}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ml-1 pt-1 ${subtle}`}>
        Material Debts & Inventory
      </h3>

      <div className="space-y-3">
        {materialData.map(mat => {
          const isAdvanced = mat.remaining < 0
          const absRemaining = Math.abs(mat.remaining)
          const baseForPercent = Math.max(mat.expense, 1)
          const percentPaid = isAdvanced ? 100 : Math.min(Math.round((mat.paid / baseForPercent) * 100), 100)
          const hasInventory = mat.unit && mat.totalQuantity > 0

          const isExpanded = expandedId === mat.id
          
          const matHistory = isExpanded 
            ? transactions.filter(t => t.categoryId === mat.id).sort((a, b) => new Date(b.date) - new Date(a.date))
            : []

          return (
            <div
              key={mat.id}
              className={`w-full text-left rounded-2xl border shadow-sm transition-all ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800/70 shadow-black/20'
                  : 'bg-white border-slate-200/80 shadow-slate-100'
              }`}
            >
              <div 
                onClick={() => onCardClick(mat.id)}
                className={`group cursor-pointer relative p-4 rounded-t-2xl overflow-hidden active:scale-[0.98] transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${!isExpanded ? 'rounded-b-2xl' : ''}`}
              >
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                    isAdvanced ? 'bg-emerald-500/10' : (isDarkMode ? 'bg-emerald-500/8' : 'bg-emerald-500/5')
                  }`}
                  style={{ width: `${percentPaid}%` }}
                />
                <div
                  className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${percentPaid}%` }}
                />

                <div className="relative flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ProgressRing
                      percent={percentPaid}
                      color={isAdvanced ? '#10b981' : mat.color}
                      label={mat.name.charAt(0).toUpperCase()}
                      isDarkMode={isDarkMode}
                    />
                    <div className="min-w-0 flex flex-col gap-1">
                      <p className={`font-bold text-sm uppercase tracking-tight truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {mat.name}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <p className={`text-[9px] font-semibold uppercase tracking-wide ${isAdvanced ? 'text-emerald-500' : 'text-emerald-500'}`}>
                          {isAdvanced ? 'SURPLUS' : `${percentPaid}% cleared`}
                        </p>
                        
                        {hasInventory && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              <Package size={10} strokeWidth={2.5} />
                              {mat.totalQuantity.toLocaleString()} {mat.unit}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2 shrink-0">
                    <p className={`text-lg font-black tracking-tight ${isAdvanced ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isAdvanced ? '+' : ''}₹{absRemaining.toLocaleString()}
                    </p>
                    
                    {mat.remaining !== 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const settleType = isAdvanced ? 'expense' : 'payment'
                          onCardClick(mat.id, absRemaining, settleType)
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-md active:scale-90 transition-all ${
                          isAdvanced 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                        }`}
                      >
                        Settle Up
                      </button>
                    ) : (
                      <p className={`text-[8px] font-semibold uppercase tracking-widest opacity-40 ${subtle}`}>
                        All Cleared
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedId(isExpanded ? null : mat.id)
                }}
                className={`w-full py-2.5 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                  isDarkMode 
                    ? 'border-t border-slate-800/70 hover:bg-slate-800/50 text-slate-500 hover:text-slate-300' 
                    : 'border-t border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                } ${!isExpanded ? 'rounded-b-2xl' : ''}`}
              >
                {isExpanded ? (
                  <><ChevronUp size={14} /> Hide History</>
                ) : (
                  <><ChevronDown size={14} /> View History</>
                )}
              </button>

              {isExpanded && (
                <div className={`p-2 rounded-b-2xl border-t ${
                  isDarkMode ? 'bg-slate-900/50 border-slate-800/70' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-1.5 px-2 pb-2 pt-1">
                    {matHistory.length === 0 ? (
                      <p className={`text-[10px] text-center py-4 uppercase tracking-widest font-bold ${subtle}`}>No history</p>
                    ) : (
                      matHistory.map(tx => {
                        const isExpenseTx = tx.type === 'expense'
                        return (
                          <div key={tx.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${
                            isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200/60 shadow-sm'
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                isExpenseTx 
                                  ? (isDarkMode ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-500') 
                                  : (isDarkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600')
                              }`}>
                                {isExpenseTx ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownLeft size={12} strokeWidth={3} />}
                              </div>
                              
                              <div>
                                {/* FIXED: flex-wrap added here to handle longer date strings gracefully */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className={`text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                    {formatShortDate(tx.date)}
                                  </p>
                                  {tx.quantity && (
                                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                      isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                      {tx.quantity} {mat.unit || 'Qty'}
                                    </span>
                                  )}
                                </div>
                                {tx.vendor && (
                                  <p className={`text-[9px] font-medium mt-0.5 truncate max-w-[120px] ${subtle}`}>
                                    {tx.vendor}
                                  </p>
                                )}
                              </div>
                            </div>

                            <p className={`font-black text-xs tracking-tight ${
                              isExpenseTx ? 'text-rose-500' : 'text-emerald-500'
                            }`}>
                              {isExpenseTx ? '' : '+'}₹{tx.amount.toLocaleString()}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}