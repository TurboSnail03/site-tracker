import { useState, useEffect, useRef } from 'react'
import { X, Calendar, Lock, Hash } from 'lucide-react'
import { getNextColor } from './colors'

// Collision-safe ID generator
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
    unit:            '', 
    quantity:        '', 
    date:            getNow(),
  })

  const inputRef = useRef(null)

  const resetForm = () => {
    setFormData({
      type:            'expense',
      categoryId:      '',
      amount:          '',
      vendor:          '',
      newCategoryName: '',
      unit:            '',
      quantity:        '',
      date:            getNow(),
    })
  }

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type:            initialType || 'expense',
        categoryId:      initialCatId || '',
        amount:          initialAmount ? String(initialAmount) : '',
        vendor:          '', 
        newCategoryName: '', 
        unit:            '', 
        quantity:        '', 
        date:            getNow(),
      })
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      resetForm()
    }
  }, [isOpen, initialCatId, initialAmount, initialType])

  if (!isOpen) return null

  const isFastLogMode = !!initialCatId

  // Determine if we should show the quantity input.
  const shouldShowQuantity = formData.type === 'expense' || (formData.type === 'payment' && !isFastLogMode)

  const handleAmountChange = (e) => {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setFormData({ ...formData, amount: val })
    }
  }

  const handleQuantityChange = (e) => {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setFormData({ ...formData, quantity: val })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.amount || Number(formData.amount) <= 0) return

    let finalCatId     = formData.categoryId
    let newCategoryObj = null

    if (!isFastLogMode) {
      if (!formData.newCategoryName.trim()) return
      finalCatId     = makeId('cat')
      newCategoryObj = {
        id:    finalCatId,
        name:  formData.newCategoryName.trim(),
        unit:  formData.unit.trim() || null, 
        color: getNextColor(Object.keys(categories).length),
      }
    }

    if (!finalCatId) return

    onAddTransaction({
      id:         makeId('tx'),
      categoryId: finalCatId,
      type:       formData.type,
      amount:     Number(formData.amount),
      quantity:   shouldShowQuantity && formData.quantity ? Number(formData.quantity) : null,
      vendor:     formData.vendor.trim(),
      date:       formData.date,
    }, newCategoryObj)

    resetForm()
    onClose()
  }

  const uniqueVendors = [...new Set(transactions.map(tx => tx.vendor?.trim()).filter(Boolean))]

  const isExpense = formData.type === 'expense'
  const inputBg   = isDarkMode ? 'bg-slate-800/80'   : 'bg-slate-50'
  const textClr   = isDarkMode ? 'text-slate-100'    : 'text-slate-800'
  const modalBg   = isDarkMode ? 'bg-slate-900 border-slate-800/50' : 'bg-white border-slate-100'
  const subtle    = isDarkMode ? 'text-slate-500'    : 'text-slate-400'

  const accentColor  = isExpense ? 'text-rose-500'      : 'text-emerald-500'
  const accentBg     = isExpense ? 'bg-rose-500'        : 'bg-emerald-500'
  const accentShadow = isExpense ? 'shadow-rose-500/30' : 'shadow-emerald-500/30'

  // Retrieve the locked unit if we are in Fast-Log mode
  const lockedUnit = isFastLogMode ? categories[initialCatId]?.unit : null

  return (
    <div
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className={`${modalBg} w-full max-w-md rounded-t-3xl shadow-2xl animate-slide-up px-6 pt-6 modal-bottom-safe border-t transition-colors duration-300 modal-sheet`}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-black uppercase tracking-tight ${accentColor}`}>
              {isFastLogMode ? `Log ${formData.type}` : 'New Setup'}
            </h2>
            <p className={`text-[10px] font-medium mt-0.5 uppercase tracking-widest ${subtle}`}>
              {isFastLogMode ? 'Add to existing ledger' : 'Setup a new category'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`touch-target p-2.5 rounded-xl ${inputBg} ${subtle} hover:text-slate-700 active:scale-90 transition-all`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 autoComplete-off">

          {/* Type Toggle */}
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
                autoComplete="off"
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
            
            {/* The Separated Contextual Flow */}
            {isFastLogMode ? (
              // FAST-LOG MODE: Locked Category Display
              <div className={`p-4 rounded-xl flex items-center justify-between border border-transparent ${inputBg}`}>
                <div className="flex items-center gap-3">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: categories[initialCatId]?.color }} 
                  />
                  <p className={`font-bold text-sm uppercase tracking-tight ${textClr}`}>
                    {categories[initialCatId]?.name}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 ${subtle}`}>
                  {lockedUnit && (
                     <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-500/10 px-2 py-0.5 rounded-md mr-2">
                       Measured in {lockedUnit}
                     </span>
                  )}
                  <Lock size={12} />
                </div>
              </div>
            ) : (
              // NEW SETUP MODE: Name and Unit (FIXED: Converted to strictly contained Grid)
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Material Name (e.g. Cement)"
                  value={formData.newCategoryName}
                  onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                  className={`col-span-2 w-full p-4 rounded-xl outline-none font-semibold text-sm border focus:border-blue-500/40 transition-colors ${inputBg} ${textClr} ${
                    isDarkMode ? 'border-slate-700/50' : 'border-slate-200'
                  }`}
                  required
                />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Unit (opt.)"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={`col-span-1 w-full p-4 rounded-xl outline-none font-semibold text-sm border focus:border-blue-500/40 transition-colors ${inputBg} ${textClr} ${
                    isDarkMode ? 'border-slate-700/50' : 'border-slate-200'
                  }`}
                  title="e.g. Bags, Tonnes, Liters"
                />
              </div>
            )}

            {/* Optional Quantity Input */}
            {shouldShowQuantity && (
               <div className={`relative flex items-center rounded-xl w-full border border-transparent focus-within:border-blue-500/40 transition-colors ${inputBg}`}>
                 <Hash size={16} className={`absolute left-3.5 pointer-events-none ${subtle}`} />
                 <input
                   type="text"
                   inputMode="decimal"
                   autoComplete="off"
                   placeholder={`Quantity / No. of ${lockedUnit || formData.unit || 'Items'} (Optional)`}
                   value={formData.quantity}
                   onChange={handleQuantityChange}
                   className={`w-full py-4 pl-10 pr-3 outline-none font-semibold text-sm tracking-tight bg-transparent ${textClr}`}
                 />
               </div>
            )}

            {/* Date and Vendor (FIXED: Converted to Grid) */}
            <div className="grid grid-cols-2 gap-2">
              {/* Date Picker */}
              <div className={`relative flex items-center w-full rounded-xl ${inputBg}`}>
                <Calendar size={16} className={`absolute left-3.5 pointer-events-none ${subtle}`} />
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  onClick={(e) => e.target.showPicker?.()}
                  style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                  className={`w-full py-4 pl-10 pr-3 outline-none font-semibold text-xs tracking-tight cursor-pointer bg-transparent ${textClr}`}
                />
              </div>

              {/* Vendor Autocomplete */}
              <div className="w-full">
                <datalist id="vendor-list">
                  {uniqueVendors.map(v => <option key={v} value={v} />)}
                </datalist>
                <input
                  type="text"
                  list="vendor-list"
                  autoComplete="off"
                  placeholder="Vendor (opt.)"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className={`w-full p-4 rounded-xl outline-none text-xs font-semibold border border-transparent focus:border-blue-500/40 transition-colors ${inputBg} ${textClr}`}
                />
              </div>
            </div>

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