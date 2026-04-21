import { useState, useEffect, useRef } from 'react'
import { X, Plus, ChevronDown, ArrowLeft, Calendar } from 'lucide-react'

// UPDATED: Added initialAmount and initialType to props
export default function TransactionModal({ isDarkMode, isOpen, onClose, categories, onAddTransaction, initialCatId, initialAmount = '', initialType = 'expense', transactions = [] }) {
  const getNow = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState({ 
    type: 'expense', 
    categoryId: '', 
    amount: '', 
    vendor: '', 
    newCategoryName: '',
    date: getNow()
  })
  
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const inputRef = useRef(null)

  // UPDATED: Use effect now listens for initialAmount and initialType
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        categoryId: initialCatId || '',
        amount: initialAmount ? String(initialAmount) : '',
        type: initialType,
        date: getNow()
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
    let finalCatId = formData.categoryId
    let newCategoryObj = null

    if (isCreatingNew && formData.newCategoryName) {
      finalCatId = 'cat-' + Date.now()
      newCategoryObj = { 
        id: finalCatId, 
        name: formData.newCategoryName.trim(), 
        color: `hsl(${Math.random() * 360}, 75%, 60%)` 
      }
    }

    if (!finalCatId) return
    onAddTransaction({
      id: 'tx-' + Date.now(),
      categoryId: finalCatId,
      type: formData.type,
      amount: Number(formData.amount),
      vendor: formData.vendor.trim(),
      date: formData.date
    }, newCategoryObj)
    onClose()
  }

  const uniqueVendors = [...new Set(transactions.map(tx => tx.vendor?.trim()).filter(Boolean))]

  const isExpense = formData.type === 'expense'
  const theme = {
    modalBg: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100',
    inputBg: isDarkMode ? 'bg-slate-800' : 'bg-amber-50/50',
    text: isDarkMode ? 'text-white' : 'text-slate-800'
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-end justify-center">
      <div className={`${theme.modalBg} w-full max-w-md rounded-t-[3rem] shadow-2xl animate-slide-up p-8 pb-14 border-t transition-colors duration-300`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-2xl font-black uppercase tracking-tighter transition-colors ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
            Log {formData.type}
          </h2>
          <button onClick={onClose} className={`p-3 rounded-2xl text-slate-400 active:scale-90 transition-all ${theme.inputBg}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`flex p-1.5 rounded-[1.5rem] relative ${theme.inputBg}`}>
            <button key="expense" type="button" onClick={() => setFormData({...formData, type: 'expense'})} 
              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all z-10 ${isExpense ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40' : 'text-slate-400'}`}>
              Expense
            </button>
            <button key="payment" type="button" onClick={() => setFormData({...formData, type: 'payment'})} 
              className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all z-10 ${!isExpense ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'text-slate-400'}`}>
              Payment
            </button>
          </div>

          <div className="relative py-2">
            <input ref={inputRef} type="text" inputMode="decimal" placeholder="0" value={formData.amount} onChange={handleAmountChange}
              className={`w-full text-center text-6xl font-black bg-transparent focus:outline-none transition-colors ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`} />
            <p className="text-center text-[9px] font-black text-slate-400 opacity-40 mt-4 uppercase tracking-[0.4em]">Amount (₹)</p>
          </div>

          <div className="space-y-4">
            <div className={`relative flex items-center rounded-[1.5rem] ${theme.inputBg}`}>
              <Calendar size={18} className="absolute left-5 text-slate-400 pointer-events-none" />
              <input 
                type="datetime-local" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                // The quick fix to make the calendar open instantly
                onClick={(e) => e.target.showPicker?.()}
                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                className={`w-full p-5 pl-14 outline-none font-black text-sm tracking-tight cursor-pointer bg-transparent ${theme.text}`} 
              />
            </div>

            {isCreatingNew ? (
              <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <button type="button" onClick={() => setIsCreatingNew(false)} className={`p-5 rounded-[1.5rem] text-slate-500 active:scale-90 ${theme.inputBg}`}>
                  <ArrowLeft size={20}/>
                </button>
                <input type="text" placeholder="Material Name..." value={formData.newCategoryName} onChange={(e) => setFormData({...formData, newCategoryName: e.target.value})}
                  className={`flex-1 p-5 border-2 border-blue-500/10 rounded-[1.5rem] outline-none font-bold ${theme.inputBg} ${theme.text}`} />
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select 
                    value={formData.categoryId} 
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    style={{ color: formData.categoryId ? categories[formData.categoryId]?.color : '#94a3b8' }}
                    className={`w-full p-5 rounded-[1.5rem] outline-none appearance-none font-black text-sm tracking-tight ${theme.inputBg}`}
                  >
                    <option value="" style={{ color: '#94a3b8' }}>Select Material...</option>
                    {Object.values(categories).map(c => (
                      <option key={c.id} value={c.id} style={{ color: c.color, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }} className="font-bold">
                        ● {c.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
                <button type="button" onClick={() => setIsCreatingNew(true)} className={`p-5 text-blue-600 rounded-[1.5rem] active:scale-95 ${theme.inputBg}`}>
                  <Plus size={20}/>
                </button>
              </div>
            )}
            
            <datalist id="vendor-list">
              {uniqueVendors.map((v, i) => <option key={i} value={v} />)}
            </datalist>

            <input 
              type="text" 
              list="vendor-list"
              placeholder="Vendor / Note (Optional)" 
              value={formData.vendor} 
              onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              className={`w-full p-5 rounded-[1.5rem] outline-none font-medium border-2 border-transparent focus:border-blue-500/10 ${theme.inputBg} ${theme.text}`} 
            />
          </div>

          <button type="submit" className={`w-full text-white font-black py-6 rounded-[2rem] shadow-xl text-lg active:scale-95 transition-all uppercase tracking-[0.2em] ${isExpense ? 'bg-rose-500 shadow-rose-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}>
            Save {formData.type}
          </button>
        </form>
      </div>
    </div>
  )
}