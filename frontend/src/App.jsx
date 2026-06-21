import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Leaf, LayoutDashboard, Target, MessageSquare, Plus, 
  Sun, Moon, RefreshCw, AlertCircle, Loader2 
} from 'lucide-react';

import Calculator from './components/Calculator';
import Dashboard from './components/Dashboard';
import Actions from './components/Actions';
import Chat from './components/Chat';
import Logger from './components/Logger';

// Set active API base url
const API_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:3000'
  : window.location.origin;

export default function App() {
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogger, setShowLogger] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Profile
      try {
        const profileRes = await axios.get(`${API_URL}/api/profile`);
        if (profileRes.data && profileRes.data.profileExists) {
          setProfile(profileRes.data.profile);
        } else {
          setProfile(null);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setProfile(null);
        } else {
          throw err;
        }
      }

      // 2. Fetch Activities
      const actRes = await axios.get(`${API_URL}/api/activities`);
      setActivities(actRes.data);

      // 3. Fetch Commitments
      const comRes = await axios.get(`${API_URL}/api/commitments`);
      setCommitments(comRes.data);

    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMsg('Failed to connect to the backend server. Make sure the server is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Action handlers
  const handleSaveProfile = async (answers) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/profile`, answers);
      await fetchData();
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMsg('Failed to save profile baseline calculation.');
      setLoading(false);
    }
  };

  const handleLogActivity = async (activityData) => {
    try {
      await axios.post(`${API_URL}/api/activities`, activityData);
      setShowLogger(false);
      await fetchData();
    } catch (err) {
      console.error('Error logging activity:', err);
      alert('Error logging activity: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteActivity = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/activities/${id}`);
      await fetchData();
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert('Error deleting activity.');
    }
  };

  const handleUpdateCommitmentStatus = async (actionId, status) => {
    try {
      await axios.post(`${API_URL}/api/commitments/${actionId}/status`, { status });
      await fetchData();
    } catch (err) {
      console.error('Error updating commitment status:', err);
      alert('Error updating goal status.');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all your logs and baseline footprint? This action is irreversible.')) {
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/reset`);
      setProfile(null);
      setActivities([]);
      await fetchData();
    } catch (err) {
      console.error('Error resetting footprint tracker:', err);
      setErrorMsg('Reset execution failed.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col items-center justify-center text-zinc-500 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="text-sm font-semibold tracking-wide">Syncing EcoPulse data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] transition-colors duration-200 flex flex-col justify-between">
      
      {/* 1. Header Navigation Row */}
      <header className="bg-white dark:bg-[#0c0c0f] border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-[1400px] mx-auto p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Leaf size={24} className="fill-emerald-500/20" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                EcoPulse
              </h1>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Carbon Footprint Engine</p>
            </div>
          </div>

          {/* Nav Tabs (only if profile is created) */}
          {profile && (
            <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-lg border border-zinc-200/50 dark:border-zinc-800/40">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <LayoutDashboard size={14} /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'actions'
                    ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <Target size={14} /> Goals & Actions
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-zinc-800 text-blue-500 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <MessageSquare size={14} /> AI Assistant
              </button>
            </div>
          )}

          {/* Action utilities (Theme, Log, Reset) */}
          <div className="flex items-center gap-3">
            {profile && (
              <button
                onClick={() => setShowLogger(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus size={14} /> Log Activity
              </button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {profile && (
              <button
                onClick={handleReset}
                className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-red-500/10 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/35 rounded-lg text-zinc-400 dark:text-zinc-500 transition-colors"
                title="Reset Baseline & Logs"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6">
        
        {/* Error notice */}
        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 rounded-xl p-4 flex gap-3 text-xs mb-6 max-w-2xl mx-auto">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <span className="font-bold block mb-1">Connection Error</span>
              <span>{errorMsg}</span>
              <button 
                onClick={fetchData}
                className="mt-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline block"
              >
                Retry syncing
              </button>
            </div>
          </div>
        )}

        {/* Core Layout Switch */}
        {!profile ? (
          <div className="py-8">
            <div className="text-center max-w-md mx-auto mb-8">
              <h2 className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Meet EcoPulse.</h2>
              <p className="text-zinc-500 text-sm mt-2">
                Calculate your custom baseline carbon footprint and construct dynamic reduction strategies through simple daily actions and AI insights.
              </p>
            </div>
            <Calculator onSave={handleSaveProfile} />
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'dashboard' && (
              <Dashboard 
                profile={profile}
                activities={activities}
                commitments={commitments}
                onDeleteActivity={handleDeleteActivity}
                onOpenLogger={() => setShowLogger(true)}
                onReset={handleReset}
              />
            )}

            {activeTab === 'actions' && (
              <Actions 
                commitments={commitments}
                onUpdateStatus={handleUpdateCommitmentStatus}
                baselineTotal={profile.total}
              />
            )}

            {activeTab === 'chat' && (
              <div className="max-w-3xl mx-auto">
                <Chat API_URL={API_URL} />
              </div>
            )}
          </div>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-[10px] text-zinc-500 bg-white dark:bg-[#0c0c0f]/20 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; 2026 EcoPulse Carbon Engine. All Rights Reserved. Built with React, Tailwind & Google Gemini.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Documentation</a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Calculations Schema</a>
            <a href="#" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>

      {/* 4. Activity Logger Modal overlay */}
      {showLogger && (
        <Logger 
          onClose={() => setShowLogger(false)}
          onLog={handleLogActivity}
        />
      )}

    </div>
  );
}
