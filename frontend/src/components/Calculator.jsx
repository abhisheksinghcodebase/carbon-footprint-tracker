import React, { useState } from 'react';
import { Shield, ArrowRight, ArrowLeft, Leaf, Home, Car, Utensils, ShoppingBag } from 'lucide-react';

export default function Calculator({ onSave }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    householdSize: 1,
    carMileage: 8000,
    carType: 'gasolineCar',
    flightsShort: 2,
    flightsMedium: 1,
    flightsLong: 0,
    transitMileage: 10,
    electricityBill: 100,
    gasBill: 50,
    dietType: 'average',
    clothingPurchases: 3,
    electronicsPurchases: 1,
    wasteOutput: 2,
    recycleRate: 30
  });

  const updateAnswer = (key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(answers);
  };

  // Progress percentage
  const totalSteps = 4;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm transition-all duration-300 animate-slide-in">
      {/* Header & Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Leaf size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Onboarding Calculator</h2>
              <p className="text-xs text-zinc-500">Calculate your baseline annual carbon emissions</p>
            </div>
          </div>
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Step {step} of {totalSteps}</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: Basic & Household */}
        {step === 1 && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <Home className="text-zinc-400 dark:text-zinc-500" size={24} />
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Household & Energy</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  How many people live in your household?
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.householdSize}
                  onChange={(e) => updateAnswer('householdSize', parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Average Monthly Electricity Bill ($)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.electricityBill}
                  onChange={(e) => updateAnswer('electricityBill', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Average Monthly Natural Gas Bill ($)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.gasBill}
                  onChange={(e) => updateAnswer('gasBill', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-zinc-100 dark:border-zinc-800/50 flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <Shield size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span>We estimate utility consumption in kWh and therms by using regional pricing rules ($0.16/kWh, $1.20/therm). Higher household size splits utility footprints.</span>
            </div>
          </div>
        )}

        {/* STEP 2: Transportation */}
        {step === 2 && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <Car className="text-zinc-400 dark:text-zinc-500" size={24} />
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Transportation</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Annual Mileage Driven (miles)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.carMileage}
                  onChange={(e) => updateAnswer('carMileage', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Vehicle Type
                </label>
                <select
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.carType}
                  onChange={(e) => updateAnswer('carType', e.target.value)}
                >
                  <option value="gasolineCar">Gasoline SUV / Car</option>
                  <option value="dieselCar">Diesel Vehicle</option>
                  <option value="hybridCar">Hybrid Vehicle</option>
                  <option value="electricCar">Electric Vehicle (EV)</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Weekly Public Transit (miles)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.transitMileage}
                  onChange={(e) => updateAnswer('transitMileage', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Short Flights (1-3 hr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-sm text-center focus:outline-none text-zinc-950 dark:text-zinc-100"
                    value={answers.flightsShort}
                    onChange={(e) => updateAnswer('flightsShort', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Med Flights (3-6 hr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-sm text-center focus:outline-none text-zinc-950 dark:text-zinc-100"
                    value={answers.flightsMedium}
                    onChange={(e) => updateAnswer('flightsMedium', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Long Flights (6+ hr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-2 text-sm text-center focus:outline-none text-zinc-950 dark:text-zinc-100"
                    value={answers.flightsLong}
                    onChange={(e) => updateAnswer('flightsLong', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Diet & Food */}
        {step === 3 && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <Utensils className="text-zinc-400 dark:text-zinc-500" size={24} />
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Diet & Food Habits</h3>
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Which diet best represents your eating habits?
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'meatLover', title: 'Heavy Meat Consumer', desc: 'Frequent red meat, lamb, and dairy daily.' },
                  { id: 'average', title: 'Average/Mixed Diet', desc: 'Moderate meat, poultry, fish, and dairy.' },
                  { id: 'vegetarian', title: 'Vegetarian', desc: 'No meat or fish. Incorporates cheese, eggs, milk.' },
                  { id: 'vegan', title: 'Vegan / Plant-based', desc: 'Strictly plant-derived. Zero animal products.' }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => updateAnswer('dietType', item.id)}
                    className={`p-4 border rounded-xl cursor-pointer hover:border-blue-500/80 transition-all ${
                      answers.dietType === item.id 
                        ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 text-zinc-900 dark:text-zinc-50' 
                        : 'border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#0c0c0f]'
                    }`}
                  >
                    <span className="block font-semibold text-sm">{item.title}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Consumption & Waste */}
        {step === 4 && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag className="text-zinc-400 dark:text-zinc-500" size={24} />
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Shopping & Waste</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  New clothes purchased monthly (items)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.clothingPurchases}
                  onChange={(e) => updateAnswer('clothingPurchases', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Electronics purchased annually (devices)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.electronicsPurchases}
                  onChange={(e) => updateAnswer('electronicsPurchases', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Weekly household trash bags (~5kg each)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  value={answers.wasteOutput}
                  onChange={(e) => updateAnswer('wasteOutput', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  How much of your waste do you recycle? (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="w-full accent-blue-500"
                    value={answers.recycleRate}
                    onChange={(e) => updateAnswer('recycleRate', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm font-semibold w-12 text-right text-zinc-900 dark:text-zinc-50">{answers.recycleRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-[#047857] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors shadow-sm"
            >
              Calculate baseline <Leaf size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
