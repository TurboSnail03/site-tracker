import { useState, useEffect, useRef } from 'react'
import { X, Plus, ChevronDown, ArrowLeft, Calendar } from 'lucide-react'
import { getNextColor } from './colors'

// FIX #10: Collision-safe ID generator — appends random suffix so two IDs
// created within the same millisecond are still distinct.
const makeId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export default function TransactionModal({
  isDarkMode,
  isOpen,
  onClose,
  categories,
  onAddTransaction,
  initialCatId,
  initialAmount = '',
  initialType   = 'expense',
  transactions  = [],
}) {
  const getNow = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState({
    type:            'expense',
    categoryId:      '',
    amount:          '',
    vendor:          '',
    newCategoryName: '',
    date:            getNow(),
  })

  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        categoryId: initialCatId || '',
        amount:     initialAmount ? String(initialAmount) : '',
        type:       initialType,
        date:       getNow(),
      }))
      setIsCreatingNew(!initialCatId && Object.keys(categories).length === 0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, initialCatId, initialAmount, initialType, categories])

  if (!isOpen) return null

  const handleAmountChange = (e) => {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setFormData({ ...formData, amount: val })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.amount || Number(formData.amount) <= 0) return

    let finalCatId     = formData.categoryId
    let newCategoryObj = null

    if (isCreatingNew && formData.newCategoryName) {
      finalCatId     = makeId('cat') // FIX #10
      newCategoryObj = {
        id:    finalCatId,
        name:  formData.newCategoryName.trim(),
        // Assign the next color from the curated palette so every material
        // gets a perceptually distinct, easily recognizable hue.
        color: getNextColor(Object.keys(categories).length),
      }
    }

    if (!finalCatId) return

    onAddTransaction({
      id:         makeId('tx'), // FIX #10
      categoryId: finalCatId,
      type:       formData.type,
      amount:     Number(formData.amount),
      vendor:     formData.vendor.trim(),
      date:       formData.date,
    }, newCategoryObj)

    onClose()
  }

  // FIX #11: Use vendor value as key — names are already deduplicated,
  // so the value is stable and avoids the index-as-key anti-pattern.
  const uniqueVendors = [...new Set(transactions.map(tx => tx.vendor?.trim()).filter(Boolean))]

  const isExpense = formData.type === 'expense'
  const inputBg   = isDarkMode ? 'bg-slate-800/80'   : 'bg-slate-50'
  const textClr   = isDarkMode ? 'text-slate-100'    : 'text-slate-800'
  const modalBg   = isDarkMode ? 'bg-slate-900 border-slate-800/50' : 'bg-white border-slate-100'
  const subtle    = isDarkMode ? 'text-slate-500'    : 'text-slate-400'

  const accentColor  = isExpense ? 'text-rose-500'    : 'text-emerald-500'
  const accentBg     = isExpense ? 'bg-rose-500'      : 'bg-emerald-500'
  const accentShadow = isExpense ? 'shadow-rose-500/30' : 'shadow-emerald-500/30'

  return (
    // FIX #13: Clicking the backdrop (overlay) dismisses the modal.
    // The inner sheet stops propagation so clicks inside don't bubble up.
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className={`${modalBg} w-full max-w-md rounded-t-3xl shadow-2xl animate-slide-up px-6 pt-6 modal-bottom-safe border-t transition-colors duration-300 modal-sheet`}
        onClick={(e) => e.stopPropagation()} // FIX #13: prevent bubble from inner sheet
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-black uppercase tracking-tight ${accentColor}`}>
              Log {formData.type}
            </h2>
            <p className={`text-[10px] font-medium mt-0.5 uppercase tracking-widest ${subtle}`}>
              New entry for {formData.type === 'expense' ? 'a cost' : 'a payment'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`touch-target p-2.5 rounded-xl ${inputBg} ${subtle} hover:text-slate-700 active:scale-90 transition-all`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Type Toggle — pill style with smooth transition */}
          <div className={`flex p-1 rounded-2xl ${inputBg}`}>
            {[
              { value: 'expense', label: 'Expense', active: 'bg-rose-500 shadow-rose-500/30' },
              { value: 'payment', label: 'Payment', active: 'bg-emerald-500 shadow-emerald-500/30' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: opt.value })}
                className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  formData.type === opt.value
                    ? `${opt.active} text-white shadow-lg`
                    : `${subtle}`
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="py-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-3xl font-black ${accentColor} opacity-50`}>₹</span>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={formData.amount}
                onChange={handleAmountChange}
                className={`text-center text-6xl font-black bg-transparent focus:outline-none transition-colors w-full ${accentColor}`}
              />
            </div>
            <p className={`text-[9px] font-semibold mt-2 uppercase tracking-[0.4em] ${subtle}`}>
              Amount (Indian Rupees)
            </p>
          </div>

          <div className="space-y-3">
            {/* Date Picker */}
            <div className={`relative flex items-center rounded-xl ${inputBg}`}>
              <Calendar size={16} className={`absolute left-4 pointer-events-none ${subtle}`} />
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                onClick={(e) => e.target.showPicker?.()}
                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                className={`w-full p-4 pl-11 outline-none font-semibold text-sm tracking-tight cursor-pointer bg-transparent ${textClr}`}
              />
            </div>

            {/* Category Selector / Creator */}
            {isCreatingNew ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className={`p-4 rounded-xl ${subtle} active:scale-90 ${inputBg}`}
                >
                  <ArrowLeft size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Material name…"
                  value={formData.newCategoryName}
                  onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                  className={`flex-1 p-4 rounded-xl outline-none font-semibold border border-blue-500/20 ${inputBg} ${textClr}`}
                />
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    style={{ color: formData.categoryId ? categories[formData.categoryId]?.color : undefined }}
                    className={`w-full p-4 rounded-xl outline-none appearance-none font-bold text-sm tracking-tight ${inputBg} ${!formData.categoryId ? subtle : ''}`}
                  >
                    <option value="" className="text-slate-400">Select Material…</option>
                    {Object.values(categories).map(c => (
                      <option
                        key={c.id}
                        value={c.id}
                        style={{ color: c.color, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }}
                        className="font-bold"
                      >
                        ● {c.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${subtle}`}
                    size={16}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className={`p-4 text-blue-500 rounded-xl active:scale-95 ${inputBg}`}
                  title="New material"
                >
                  <Plus size={18} />
                </button>
              </div>
            )}

            {/* Vendor Autocomplete */}
            <datalist id="vendor-list">
              {/* FIX #11: Use vendor name as key instead of array index */}
              {uniqueVendors.map(v => <option key={v} value={v} />)}
            </datalist>
            <input
              type="text"
              list="vendor-list"
              placeholder="Vendor / Note (optional)"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              className={`w-full p-4 rounded-xl outline-none font-medium border border-transparent focus:border-blue-500/20 transition-colors ${inputBg} ${textClr}`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full text-white font-black py-5 rounded-2xl shadow-xl text-base active:scale-95 transition-all uppercase tracking-[0.15em] ${accentBg} ${accentShadow}`}
          >
            Save {formData.type}
          </button>
        </form>
      </div>
    </div>
  )
}
