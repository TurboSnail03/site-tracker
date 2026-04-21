import { useState, useEffect, useRef } from 'react'
import { X, Plus, ChevronDown, ArrowLeft } from 'lucide-react'

export default function TransactionModal({ isOpen, onClose, categories, onAddTransaction, initialCatId }) {
  const [formData, setFormData] = useState({ type: 'expense', categoryId: '', amount: '', vendor: '', newCategoryName: '' })
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        categoryId: initialCatId || '',
        amount: '',
        type: initialCatId ? 'payment' : 'expense' 
      }))
      setIsCreatingNew(!initialCatId && Object.keys(categories).length === 0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, initialCatId, categories])

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
      date: new Date().toISOString().split('T')[0]
    }, newCategoryObj)
    onClose()
  }

  const isExpense = formData.type === 'expense'

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end justify-center">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[3rem] shadow-2xl animate-slide-up p-8 pb-14 border-t border-amber-100/30 dark:border-slate-800">
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-2xl font-black uppercase tracking-tighter transition-colors ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
            Log {formData.type}
          </h2>
          <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] relative">
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
            <p className="text-center text-[9px] font-black text-slate-300 dark:text-slate-600 mt-4 uppercase tracking-[0.4em]">Amount (₹)</p>
          </div>

          <div className="space-y-4">
            {isCreatingNew ? (
              <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <button type="button" onClick={() => setIsCreatingNew(false)} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] text-slate-500 active:scale-90">
                  <ArrowLeft size={20}/>
                </button>
                <input type="text" placeholder="Material Name..." value={formData.newCategoryName} onChange={(e) => setFormData({...formData, newCategoryName: e.target.value})}
                  className="flex-1 p-5 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/20 rounded-[1.5rem] dark:text-white outline-none font-bold" />
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select 
                    value={formData.categoryId} 
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    style={{ color: formData.categoryId ? categories[formData.categoryId]?.color : '#94a3b8' }}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] outline-none appearance-none font-black text-sm tracking-tight border-2 border-transparent focus:border-slate-200"
                  >
                    <option value="" style={{ color: '#94a3b8' }}>Select Material...</option>
                    {Object.values(categories).map(c => (
                      <option key={c.id} value={c.id} style={{ color: c.color, backgroundColor: '#1e293b' }} className="font-bold">
                        ● {c.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
                <button type="button" onClick={() => setIsCreatingNew(true)} className="p-5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[1.5rem] shadow-sm active:scale-95">
                  <Plus size={20}/>
                </button>
              </div>
            )}
            <input type="text" placeholder="Vendor / Note (Optional)" value={formData.vendor} onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] dark:text-white outline-none font-medium border-2 border-transparent focus:border-slate-200" />
          </div>

          <button type="submit" className={`w-full text-white font-black py-6 rounded-[2rem] shadow-xl text-lg active:scale-95 transition-all uppercase tracking-[0.2em] ${isExpense ? 'bg-rose-500 shadow-rose-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}>
            Save {formData.type}
          </button>
        </form>
      </div>
    </div>
  )
}