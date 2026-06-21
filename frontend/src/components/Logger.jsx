import React, { useState, useEffect, useRef } from 'react';
import { X, PlusCircle, Sparkles } from 'lucide-react';

const SUBTYPES = {
  transport: [
    { value: 'gasolineCar', label: 'Gasoline Car (Miles)' },
    { value: 'dieselCar', label: 'Diesel Car (Miles)' },
    { value: 'hybridCar', label: 'Hybrid Car (Miles)' },
    { value: 'electricCar', label: 'Electric Car (Miles)' },
    { value: 'publicTransit', label: 'Public Transit (Miles)' },
    { value: 'flightShort', label: 'Short Flight (<300 miles)' },
    { value: 'flightMedium', label: 'Medium Flight (300-1000 miles)' },
    { value: 'flightLong', label: 'Long Flight (>1000 miles)' }
  ],
  energy: [
    { value: 'electricity', label: 'Electricity (kWh)' },
    { value: 'naturalGas', label: 'Natural Gas (Therms)' },
    { value: 'lpg', label: 'LPG / Propane (Gallons)' },
    { value: 'heatingOil', label: 'Heating Oil (Gallons)' }
  ],
  food: [
    { value: 'beefOrLamb', label: 'Beef or Lamb (Meals)' },
    { value: 'poultryOrPork', label: 'Poultry or Pork (Meals)' },
    { value: 'fishOrSeafood', label: 'Fish or Seafood (Meals)' },
    { value: 'vegetarian', label: 'Vegetarian (Meals)' },
    { value: 'vegan', label: 'Vegan (Meals)' }
  ],
  consumption: [
    { value: 'clothing', label: 'Clothing Purchased (Items)' },
    { value: 'electronics', label: 'Electronics Purchased (Devices)' },
    { value: 'generalGoods', label: 'General Goods ($ spent)' },
    { value: 'wasteLandfill', label: 'Landfill Waste (kg)' },
    { value: 'wasteRecycledOffset', label: 'Recycled Waste (kg)' }
  ]
};

const FACTORS = {
  transport: { gasolineCar: 0.404, dieselCar: 0.430, hybridCar: 0.200, electricCar: 0.110, publicTransit: 0.140, flightShort: 0.225, flightMedium: 0.150, flightLong: 0.130 },
  energy: { electricity: 0.380, naturalGas: 5.300, lpg: 5.680, heatingOil: 10.200 },
  food: { beefOrLamb: 7.5, poultryOrPork: 2.5, fishOrSeafood: 1.8, vegetarian: 0.8, vegan: 0.5 },
  consumption: { clothing: 15.0, electronics: 80.0, generalGoods: 2.0, wasteLandfill: 0.5, wasteRecycledOffset: -0.2 }
};

export default function Logger({ onClose, onLog }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('transport');
  const [type, setType] = useState('gasolineCar');
  const [value, setValue] = useState(10);
  const [description, setDescription] = useState('');
  const [estimatedCO2, setEstimatedCO2] = useState(0);

  const modalRef = useRef(null);

  // Set default subtype when category changes
  useEffect(() => {
    if (SUBTYPES[category] && SUBTYPES[category].length > 0) {
      setType(SUBTYPES[category][0].value);
    }
  }, [category]);

  // Real-time estimation updates
  useEffect(() => {
    const factor = (FACTORS[category] && FACTORS[category][type]) || 0;
    const co2 = Number(value || 0) * factor;
    setEstimatedCO2(Math.round(co2 * 10) / 10);
  }, [category, type, value]);

  // Trap focus and handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Focus first input
    const firstInput = modalRef.current?.querySelector('input');
    if (firstInput) firstInput.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value <= 0) return;
    
    onLog({
      date,
      category,
      type,
      value: Number(value),
      description
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-slide-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-[#0c0c0f] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50/50 dark:bg-zinc-900/10">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <PlusCircle size={20} className="text-blue-500" />
            <h3 id="modal-title" className="text-lg font-bold">Log New Activity</h3>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close activity logger"
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="activity-date" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Date
            </label>
            <input
              id="activity-date"
              type="date"
              required
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity-category" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Category
              </label>
              <select
                id="activity-category"
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="transport">Transportation</option>
                <option value="energy">Utilities / Energy</option>
                <option value="food">Diet / Meals</option>
                <option value="consumption">Goods & Waste</option>
              </select>
            </div>

            <div>
              <label htmlFor="activity-type" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Type
              </label>
              <select
                id="activity-type"
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {(SUBTYPES[category] || []).map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="activity-value" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Quantity / Input Value
            </label>
            <input
              id="activity-value"
              type="number"
              min="0.1"
              step="any"
              required
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="activity-desc" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Short Description (optional)
            </label>
            <input
              id="activity-desc"
              type="text"
              placeholder="e.g. Flight to Boston, Weekly Groceries"
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Calculator Visual Panel */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500 animate-pulse" />
              <div className="text-xs">
                <span className="text-zinc-400 block">Real-time Estimate</span>
                <span className="text-zinc-500 dark:text-zinc-300 font-medium">Carbon emissions</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xl font-bold font-mono ${estimatedCO2 > 100 ? 'text-red-500' : estimatedCO2 > 20 ? 'text-amber-500' : estimatedCO2 < 0 ? 'text-emerald-500' : 'text-blue-500'}`}>
                {estimatedCO2 > 0 ? `+${estimatedCO2}` : estimatedCO2}
              </span>
              <span className="text-[10px] text-zinc-400 block font-medium">kg CO2e</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#059669] hover:bg-[#047857] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
            >
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
