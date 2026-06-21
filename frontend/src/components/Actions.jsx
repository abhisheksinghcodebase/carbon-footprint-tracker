import React, { useState } from 'react';
import { Target, Leaf, Plus, Check, ArrowRight, RefreshCw, ShoppingBag, Car, Utensils, Zap } from 'lucide-react';

const CATEGORY_ICONS = {
  transport: <Car className="text-blue-500" size={18} />,
  energy: <Zap className="text-amber-500" size={18} />,
  food: <Utensils className="text-emerald-500" size={18} />,
  consumption: <ShoppingBag className="text-purple-500" size={18} />
};

export default function Actions({ commitments, onUpdateStatus, baselineTotal }) {
  const [filter, setFilter] = useState('all');

  // Filter commitments
  const filtered = commitments.filter(c => filter === 'all' || c.category === filter);

  // Math stats
  const activeCommitments = commitments.filter(c => c.status === 'active');
  const completedCommitments = commitments.filter(c => c.status === 'completed');
  
  const totalActiveSavings = activeCommitments.reduce((acc, curr) => acc + curr.co2_savings, 0);
  const totalCompletedSavings = completedCommitments.reduce((acc, curr) => acc + curr.co2_savings, 0);
  
  // Reduction goal target: e.g. 20% of baseline
  const reductionGoal = baselineTotal ? Math.round(baselineTotal * 0.20) : 2000;
  const progressPercent = Math.min(100, Math.round(((totalCompletedSavings + totalActiveSavings) / reductionGoal) * 100));

  return (
    <div className="space-y-6">
      
      {/* Target Progress Bar Card */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Target size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Reduction Goal Target</h3>
              <p className="text-xs text-zinc-500">20% baseline carbon reduction objective</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {totalCompletedSavings + totalActiveSavings} / {reductionGoal} kg
            </span>
            <span className="text-[10px] text-zinc-500 block">CO2e annual savings</span>
          </div>
        </div>

        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
          <span>{progressPercent}% of target reached</span>
          <span>Target: {reductionGoal} kg CO2e / year</span>
        </div>
      </div>

      {/* Grid Filtering Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div 
          role="group" 
          aria-label="Filter goals by category" 
          className="flex gap-2 p-1 bg-zinc-100 dark:bg-[#0c0c0f] rounded-lg"
        >
          {['all', 'transport', 'energy', 'food', 'consumption'].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              aria-pressed={filter === c}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === c 
                  ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full inline-block"></span>
            {activeCommitments.length} Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
            {completedCommitments.length} Completed
          </span>
        </div>
      </div>

      {/* Commitments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((action) => {
          const isCompleted = action.status === 'completed';
          const isActive = action.status === 'active';

          return (
            <div 
              key={action.action_id}
              className={`border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 ${
                isCompleted 
                  ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10'
                  : isActive
                    ? 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
                    {CATEGORY_ICONS[action.category]}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">{action.title}</h4>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold mt-0.5">{action.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-500 font-bold text-sm">
                    -{action.co2_savings} kg
                  </span>
                  <span className="text-[9px] text-zinc-400 block">CO2e / year</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="text-xs text-zinc-400">
                  {isCompleted ? 'Target Completed' : isActive ? 'Committed & Active' : 'Available Goal'}
                </span>

                <div className="flex gap-2">
                  {isActive && (
                    <button
                      onClick={() => onUpdateStatus(action.action_id, 'available')}
                      className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  
                  {isCompleted ? (
                    <button
                      onClick={() => onUpdateStatus(action.action_id, 'active')}
                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Reactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(action.action_id, isCompleted ? 'active' : isActive ? 'completed' : 'active')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm flex items-center gap-1 ${
                        isActive 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check size={14} /> Complete
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Commit
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
