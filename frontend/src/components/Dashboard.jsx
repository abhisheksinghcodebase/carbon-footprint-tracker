import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  TrendingUp, TrendingDown, Trash2, Calendar, Filter, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  X, Info, Car, Zap, Utensils, ShoppingBag 
} from 'lucide-react';
import { format } from 'date-fns';

const CATEGORY_STYLES = {
  transport: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  energy: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  food: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  consumption: { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' }
};

export default function Dashboard({ 
  profile, 
  activities, 
  commitments, 
  onDeleteActivity, 
  onOpenLogger, 
  onReset 
}) {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '7d', '30d'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Process activities list
  const filteredActivities = activities.filter(act => {
    // 1. Category Filter
    if (categoryFilter !== 'all' && act.category !== categoryFilter) return false;
    
    // 2. Time Filter
    if (timeFilter !== 'all') {
      const actDate = new Date(act.date);
      const today = new Date();
      const diffTime = Math.abs(today - actDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (timeFilter === '7d' && diffDays > 7) return false;
      if (timeFilter === '30d' && diffDays > 30) return false;
    }
    
    return true;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  // Carbon math statistics
  const baselineTotal = profile ? profile.total : 0;
  
  // Total emissions logged
  const totalLoggedCO2 = activities.reduce((acc, curr) => acc + curr.emissions, 0);

  // Compute active commitment savings
  const activeSavings = commitments
    .filter(c => c.status === 'active')
    .reduce((acc, curr) => acc + curr.co2_savings, 0);

  const completedSavings = commitments
    .filter(c => c.status === 'completed')
    .reduce((acc, curr) => acc + curr.co2_savings, 0);

  // Math trend - compare monthly projection of logged emissions vs baseline target
  // e.g. baseline monthly average vs current logged month total
  const estimatedMonthlyBaseline = baselineTotal / 12;
  // Get emissions logged in the past 30 days
  const today = new Date();
  const past30DaysTotal = activities
    .filter(act => {
      const diffDays = Math.ceil(Math.abs(today - new Date(act.date)) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    })
    .reduce((acc, curr) => acc + curr.emissions, 0);

  const reductionPercent = estimatedMonthlyBaseline > 0 
    ? Math.round(((estimatedMonthlyBaseline - past30DaysTotal) / estimatedMonthlyBaseline) * 100)
    : 0;

  // Chart 1: Donut breakdown of category emissions
  const categoryTotals = activities.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.emissions;
    return acc;
  }, { transport: 0, energy: 0, food: 0, consumption: 0 });

  const donutOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: '#3f3f46',
      borderWidth: 1,
      textStyle: { color: '#f4f4f5', fontSize: 11, fontFamily: 'DM Sans' }
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      textStyle: { color: '#a1a1aa', fontFamily: 'DM Sans' }
    },
    color: ['#3b82f6', '#f59e0b', '#10b981', '#a855f7'],
    series: [
      {
        name: 'Carbon Source',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'transparent',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold',
            formatter: '{b}\n{d}%',
            color: '#fafafa'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: Math.round(categoryTotals.transport), name: 'Transport' },
          { value: Math.round(categoryTotals.energy), name: 'Energy/Utilities' },
          { value: Math.round(categoryTotals.food), name: 'Food/Diet' },
          { value: Math.round(categoryTotals.consumption), name: 'Consumption' }
        ]
      }
    ]
  };

  // Chart 2: Daily emissions trend over past 15 days
  const last15Days = [...Array(15)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailyEmissions = last15Days.map(date => {
    const dayTotal = activities
      .filter(act => act.date === date)
      .reduce((acc, curr) => acc + curr.emissions, 0);
    return Math.round(dayTotal * 10) / 10;
  });

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: '#3f3f46',
      borderWidth: 1,
      textStyle: { color: '#f4f4f5', fontSize: 11, fontFamily: 'DM Sans' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: last15Days.map(d => format(new Date(d), 'MMM dd')),
      axisLabel: { color: '#71717a', fontSize: 10, fontFamily: 'DM Sans' },
      axisLine: { lineStyle: { color: '#3f3f46' } }
    },
    yAxis: {
      type: 'value',
      name: 'kg CO2e',
      nameTextStyle: { color: '#71717a', fontSize: 10, fontFamily: 'DM Sans' },
      axisLabel: { color: '#71717a', fontSize: 10, fontFamily: 'DM Sans' },
      splitLine: { lineStyle: { color: '#27272a' } }
    },
    series: [
      {
        data: dailyEmissions,
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  const handleRowClick = (act) => {
    setSelectedActivity(act === selectedActivity ? null : act);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Baseline total */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Baseline Footprint</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
              {profile ? profile.total.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-zinc-500 font-medium">kg/yr</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Calculated during onboarding assessment</p>
        </div>

        {/* 30-Day logged footprint */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Last 30 Days Logged</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
              {Math.round(past30DaysTotal).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-medium">kg CO2e</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Emissions logged in past 30 days</p>
        </div>

        {/* Reduction projection */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Month vs Target</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
              {reductionPercent >= 0 ? `-${reductionPercent}%` : `+${Math.abs(reductionPercent)}%`}
            </span>
            <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              reductionPercent >= 0 
                ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' 
                : 'bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
            }`}>
              {reductionPercent >= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {reductionPercent >= 0 ? 'saving' : 'over'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Comparison against monthly baseline target</p>
        </div>

        {/* Completed actions savings */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Committed Annual Savings</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
              {(activeSavings + completedSavings).toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-medium">kg CO2e</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">{commitments.filter(c => c.status !== 'available').length} reduction targets active/met</p>
        </div>

      </div>

      {/* 2. Charts Section (Two wide panels, 1 per row for spacing rules in react_framework.md) */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Trend Bar Chart */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Carbon Intensity Trend</h3>
            <p className="text-xs text-zinc-500">Daily emissions tracked in the last 15 days</p>
          </div>
          <div className="h-64">
            {activities.length > 0 ? (
              <ReactECharts option={trendOption} style={{ height: '100%' }} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <Info size={24} className="mb-2" />
                <span className="text-xs">No daily logs recorded in the last 15 days</span>
              </div>
            )}
          </div>
        </div>

        {/* Donut Breakdown and Overview grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Donut Chart */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm md:col-span-1">
            <div className="mb-4">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Emission Sources</h3>
              <p className="text-xs text-zinc-500">Category footprint breakdown</p>
            </div>
            <div className="h-64">
              {totalLoggedCO2 > 0 ? (
                <ReactECharts option={donutOption} style={{ height: '100%' }} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <Info size={24} className="mb-2" />
                  <span className="text-xs">No carbon logs to display breakdown</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick tips panel */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm md:col-span-2">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm mb-4">Personalized Carbon Profile Insights</h3>
            
            <div className="space-y-4">
              {categoryTotals.transport > categoryTotals.energy && categoryTotals.transport > categoryTotals.food && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3 text-xs text-zinc-800 dark:text-zinc-300">
                  <Car size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">High Transport Emissions Detected</span>
                    <span>Your transportation activities represent the largest portion of your logged carbon footprint. Switching to public transit 2 days a week or carpooling can save over 500kg CO2e annually. You can log bus/train rides in the Activity Logger.</span>
                  </div>
                </div>
              )}

              {categoryTotals.energy > categoryTotals.transport && categoryTotals.energy > categoryTotals.food && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3 text-xs text-zinc-800 dark:text-zinc-300">
                  <Zap size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Optimize Heating & Electric Utilities</span>
                    <span>Electricity and Gas usage dominate your footprint. Set your thermostat 2°F lower in winter, swap incandescent bulbs for LEDs, and utilize cold water cycles on washing machines to cut utility emissions instantly by up to 15%.</span>
                  </div>
                </div>
              )}

              {categoryTotals.food > categoryTotals.transport && categoryTotals.food > categoryTotals.energy && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-3 text-xs text-zinc-800 dark:text-zinc-300">
                  <Utensils size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Incorporate Plant-Based Meals</span>
                    <span>Food choices are your highest carbon source. Shifting from beef or lamb to poultry, fish, or vegetarian meals makes a massive difference. An average vegetarian meal has 8x less carbon intensity than beef!</span>
                  </div>
                </div>
              )}

              {totalLoggedCO2 === 0 && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                  <Info size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Start Logging to Generate Insights</span>
                    <span>Add your daily transport, meal, and consumption logs using the **Log Activity** button in the header. Our algorithms will automatically compile and outline tailored suggestions here!</span>
                  </div>
                </div>
              )}

              {/* Standard insights */}
              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl flex gap-3 text-xs text-zinc-800 dark:text-zinc-300">
                <ShoppingBag size={20} className="text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Consumption & Waste Savings</span>
                  <span>Avoid landfill waste by improving your home recycling rate. Recycling offsets carbon by returning material to the manufacturing cycle. Committing to landfill reduction saves 0.5kg CO2e for every kg diverted!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Main Content Split (Table and Side Details Panel) */}
      <div className="flex gap-6 items-start transition-all duration-300">
        
        {/* Table Container */}
        <div className={`bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
          selectedActivity ? 'w-2/3' : 'w-full'
        }`}>
          
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 p-4 gap-3 bg-zinc-50/50 dark:bg-zinc-900/10">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">Carbon Activity Log</h4>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Category dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter size={12} className="text-zinc-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                  aria-label="Filter by Category"
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="transport">Transport</option>
                  <option value="energy">Utilities/Energy</option>
                  <option value="food">Diet/Meals</option>
                  <option value="consumption">Shopping/Waste</option>
                </select>
              </div>

              {/* Time dropdown */}
              <select
                value={timeFilter}
                onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
                aria-label="Filter by Time range"
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs px-2.5 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-right">CO2 Emissions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-zinc-700 dark:text-zinc-300 divide-y divide-zinc-150 dark:divide-zinc-850">
                {paginatedActivities.map((act) => {
                  const isSelected = selectedActivity?.id === act.id;
                  const catStyle = CATEGORY_STYLES[act.category] || { text: '', bg: '', border: '' };
                  
                  // Compute sparkline width based on largest value in dataset (cap at 100)
                  const maxEmissions = activities.length > 0 ? Math.max(...activities.map(a => a.emissions)) : 10;
                  const percentWidth = Math.max(5, Math.min(100, (act.emissions / maxEmissions) * 100));

                  return (
                    <tr 
                      key={act.id}
                      onClick={() => handleRowClick(act)}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                        {act.date ? format(new Date(act.date), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          {act.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-zinc-950 dark:text-zinc-100 font-medium">
                        {act.description}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-500">
                        {act.value} <span className="text-[10px] text-zinc-400">{act.type === 'generalGoods' ? '$' : act.category === 'food' ? 'meals' : 'units'}</span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          {/* Sparkline Progress Bar */}
                          <div className="w-16 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${
                                act.emissions > 50 
                                  ? 'bg-rose-500' 
                                  : act.emissions > 15 
                                    ? 'bg-amber-500' 
                                    : act.emissions < 0 
                                      ? 'bg-emerald-500' 
                                      : 'bg-blue-500'
                              }`} 
                              style={{ width: `${percentWidth}%` }}
                            />
                          </div>
                          <span className={`font-bold font-mono ${act.emissions < 0 ? 'text-emerald-500' : 'text-zinc-950 dark:text-zinc-100'}`}>
                            {act.emissions < 0 ? `${act.emissions}` : `+${act.emissions}`} <span className="text-[10px] font-normal text-zinc-400">kg</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-500">
                      No activities found. Add one to start tracking!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredActivities.length > itemsPerPage && (
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/10">
              <span className="text-xs text-zinc-500">
                Showing {startIndex + 1} to {Math.min(filteredActivities.length, startIndex + itemsPerPage)} of {filteredActivities.length} logs
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  aria-label="First page"
                  className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  aria-label="Previous page"
                  className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold px-3 text-zinc-800 dark:text-zinc-200 font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  aria-label="Next page"
                  className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  aria-label="Last page"
                  className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Side Details Panel */}
        {selectedActivity && (
          <div className="w-1/3 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 animate-slide-in shrink-0 relative">
            <button
              onClick={() => setSelectedActivity(null)}
              className="absolute top-4 right-4 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 rounded-md transition-colors"
            >
              <X size={16} />
            </button>

            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm pb-2 border-b border-zinc-150 dark:border-zinc-850">
              Activity Details
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block mb-0.5">Date logged</span>
                <span className="font-medium font-mono text-zinc-800 dark:text-zinc-200">
                  {selectedActivity.date ? format(new Date(selectedActivity.date), 'MMMM dd, yyyy') : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block mb-0.5">Category & Type</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    CATEGORY_STYLES[selectedActivity.category]?.bg
                  } ${CATEGORY_STYLES[selectedActivity.category]?.text} ${CATEGORY_STYLES[selectedActivity.category]?.border}`}>
                    {selectedActivity.category}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded">
                    {selectedActivity.type}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 block mb-0.5">Raw Logged Quantity</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                  {selectedActivity.value} units
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block mb-0.5">Emissions Output</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-xl font-extrabold font-mono ${selectedActivity.emissions < 0 ? 'text-emerald-500' : 'text-zinc-900 dark:text-zinc-50'}`}>
                    {selectedActivity.emissions < 0 ? `${selectedActivity.emissions}` : `+${selectedActivity.emissions}`}
                  </span>
                  <span className="text-xs text-zinc-400">kg CO2e</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 block mb-0.5">Custom Notes</span>
                <p className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 text-zinc-700 dark:text-zinc-300 italic">
                  "{selectedActivity.description || 'No notes added.'}"
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onDeleteActivity(selectedActivity.id);
                setSelectedActivity(null);
              }}
              className="w-full bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg py-2 text-xs font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5 mt-4"
            >
              <Trash2 size={14} /> Delete Entry
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
