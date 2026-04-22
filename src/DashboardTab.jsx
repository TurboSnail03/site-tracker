import { useMemo } from 'react'

// ── SVG Progress Ring ──────────────────────────────────────────────────────
// Pure presentational — no state, no side-effects.
// Thin stroke (3px), muted track behind active progress arc.
function ProgressRing({ percent, color, label, isDarkMode }) {
  const r        = 22
  const circ     = 2 * Math.PI * r
  const offset   = circ * (1 - Math.min(percent, 100) / 100)
  const trackClr = isDarkMode ? '#1e293b' : '#f1f5f9'

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0" aria-label={`${percent}% cleared`}>
      {/* Track */}
      <circle cx="28" cy="28" r={r} fill="none" stroke={trackClr} strokeWidth="3" />
      {/* Progress arc */}
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
      {/* Inner fill + label */}
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

export default function DashboardTab({ isDarkMode, transactions, categories, onCardClick }) {
  // ── Data computation — Updated for Advanced Payments ───────────────────────
  const materialData = useMemo(() => {
    const mats = {}
    Object.values(categories).forEach(cat => {
      mats[cat.id] = { ...cat, expense: 0, paid: 0, remaining: 0 }
    })
    transactions.forEach(tx => {
      if (!mats[tx.categoryId]) return
      if (tx.type === 'expense') mats[tx.categoryId].expense += tx.amount
      else mats[tx.categoryId].paid += tx.amount
      
      // REMOVED Math.max(0, ...) to allow negative values (Advanced Payments)
      mats[tx.categoryId].remaining = mats[tx.categoryId].expense - mats[tx.categoryId].paid
    })
    // Filter to show active categories, sort by absolute balance size
    return Object.values(mats)
      .filter(m => m.expense > 0 || m.paid > 0)
      .sort((a, b) => Math.abs(b.remaining) - Math.abs(a.remaining))
  }, [transactions, categories])

  // Calculate total expense for the breakdown chart
  const totalExpense = useMemo(() => {
    return materialData.reduce((sum, mat) => sum + mat.expense, 0)
  }, [materialData])
  // ─────────────────────────────────────────────────────────────────────────

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
    <div className="space-y-3">

      {/* ── Cost Breakdown Bar Chart ─────────────────────────────────────── */}
      {totalExpense > 0 && (
        <div className={`p-5 rounded-2xl border shadow-sm ${card}`}>
          <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 ${subtle}`}>
            Cost Breakdown
          </h3>

          {/* Segmented bar */}
          <div className={`h-3 w-full flex rounded-full overflow-hidden mb-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {materialData.map(mat => (
              <div
                key={`bar-${mat.id}`}
                style={{ width: `${(mat.expense / totalExpense) * 100}%`, backgroundColor: mat.color }}
                className="h-full transition-all duration-1000 hover:brightness-110"
              />
            ))}
          </div>

          {/* Legend */}
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

      {/* ── Section Header ───────────────────────────────────────────────── */}
      <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ml-1 pt-1 ${subtle}`}>
        Material Debts
      </h3>

      {/* ── Material Cards ───────────────────────────────────────────────── */}
      {materialData.map(mat => {
        // Logic for Advanced vs Debt
        const isAdvanced = mat.remaining < 0
        const absRemaining = Math.abs(mat.remaining)
        
        // Prevent division by zero if expense is 0 but an advance payment was made
        const baseForPercent = Math.max(mat.expense, 1)
        const percentPaid = isAdvanced ? 100 : Math.min(Math.round((mat.paid / baseForPercent) * 100), 100)

        return (
          <div
            key={mat.id}
            onClick={() => onCardClick(mat.id)}
            className={`group cursor-pointer relative w-full text-left rounded-2xl overflow-hidden border transition-all active:scale-[0.98] shadow-sm ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800/70 shadow-black/20 hover:border-slate-700'
                : 'bg-white border-slate-200/80 shadow-slate-100 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {/* Progress wash background - Green if advanced */}
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                isAdvanced ? 'bg-emerald-500/10' : (isDarkMode ? 'bg-emerald-500/8' : 'bg-emerald-500/5')
              }`}
              style={{ width: `${percentPaid}%` }}
            />
            {/* Progress bottom bar */}
            <div
              className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
              style={{ width: `${percentPaid}%` }}
            />

            <div className="relative p-4 flex justify-between items-center gap-3">
              {/* Left: ring + name */}
              <div className="flex items-center gap-3 min-w-0">
                <ProgressRing
                  percent={percentPaid}
                  color={isAdvanced ? '#10b981' : mat.color}
                  label={mat.name.charAt(0).toUpperCase()}
                  isDarkMode={isDarkMode}
                />
                <div className="min-w-0">
                  <p className={`font-bold text-sm uppercase tracking-tight truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {mat.name}
                  </p>
                  <p className={`text-[9px] font-semibold uppercase tracking-wide mt-0.5 ${isAdvanced ? 'text-emerald-500' : 'text-emerald-500'}`}>
                    {isAdvanced ? 'SURPLUS / ADVANCED' : `${percentPaid}% cleared`}
                  </p>
                </div>
              </div>

              {/* Right: amount + settle */}
              <div className="text-right flex flex-col items-end gap-2 shrink-0">
                <p className={`text-lg font-black tracking-tight ${isAdvanced ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isAdvanced ? '+' : ''}₹{absRemaining.toLocaleString()}
                </p>
                
                {mat.remaining !== 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Smart Settle: If advanced, it adds an 'expense'. If debt, it adds a 'payment'.
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
        )
      })}
    </div>
  )
}