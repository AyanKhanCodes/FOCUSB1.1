import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Square, Plus, Trash2, Clock, AlertCircle, X, Activity, Dumbbell, BarChart3 } from 'lucide-react';

// Utility to format seconds into HH:MM:SS
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Formatter for HHh MMm
const formatTotalTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

function App() {
  // --- State ---
  // Tags: { id, name, totalSeconds }
  const [tags, setTags] = useState(() => {
    const saved = localStorage.getItem('study-tags');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Web Dev', totalSeconds: 0 },
      { id: '2', name: 'DSA', totalSeconds: 0 },
      { id: '3', name: 'Projects', totalSeconds: 0 },
    ];
  });

  // Daily History: { [YYYY-MM-DD]: { tags: { tagId: seconds }, gym: boolean } }
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('study-history');
    return saved ? JSON.parse(saved) : {};
  });

  // Active Session State
  const [activeTagId, setActiveTagId] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // New Tag Input
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Delete Modal State
  const [tagToDelete, setTagToDelete] = useState(null);

  // Heatmap UI State
  const [selectedDate, setSelectedDate] = useState(null);

  // Initialize to current year-month (e.g., '2026-03')
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    const now = new Date();
    // Use local time zone string to prevent offset issues
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  const timerRef = useRef(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('study-tags', JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem('study-history', JSON.stringify(history));
  }, [history]);

  // --- Timer Logic ---
  useEffect(() => {
    if (isTimerRunning && activeTagId) {
      timerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 999); // 1ms faster for some reason
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, activeTagId]);

  // --- Handlers ---

  const handleStartSession = (tagId) => {
    setActiveTagId(tagId);
    setSessionSeconds(0);
    setIsTimerRunning(true);
    setShowEndConfirm(false);
  };

  const handleCreateTag = (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const newTag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      totalSeconds: 0,
    };
    setTags([...tags, newTag]);
    setNewTagName('');
    setIsCreating(false);
  };

  const handleDeleteTag = (e, tagId) => {
    e.stopPropagation();
    const tag = tags.find(t => t.id === tagId);
    setTagToDelete(tag);
  };

  const confirmDelete = () => {
    if (tagToDelete) {
      setTags(tags.filter(t => t.id !== tagToDelete.id));
      setTagToDelete(null);
    }
  };

  const handleEndSession = () => {
    if (!showEndConfirm) {
      setShowEndConfirm(true);
      return;
    }

    // Confirmed end - update global tags
    setTags(tags.map(tag => {
      if (tag.id === activeTagId) {
        return { ...tag, totalSeconds: tag.totalSeconds + sessionSeconds };
      }
      return tag;
    }));

    // Confirmed end - update daily history
    const d = new Date();
    const today = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setHistory(prev => {
      const dayData = prev[today] || { tags: {}, gym: false };
      const currentTagSeconds = dayData.tags ? (dayData.tags[activeTagId] || 0) : 0;
      return {
        ...prev,
        [today]: {
          ...dayData,
          tags: {
            ...(dayData.tags || {}),
            [activeTagId]: currentTagSeconds + sessionSeconds
          }
        }
      };
    });

    // Reset
    setIsTimerRunning(false);
    setActiveTagId(null);
    setSessionSeconds(0);
    setShowEndConfirm(false);
  };

  const handleToggleGym = (date) => {
    setHistory(prev => {
      const dayData = prev[date] || { tags: {}, gym: false };
      return {
        ...prev,
        [date]: {
          ...dayData,
          gym: !dayData.gym
        }
      };
    });
  };

  const activeTag = tags.find(t => t.id === activeTagId);

  // --- Heatmap Logic ---
  // Generate the 12 months for the current year (Jan-Dec)
  const monthTabs = useMemo(() => {
    const tabs = [];
    const now = new Date();
    const currentYear = now.getFullYear();

    // Start from January (0) to December (11)
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentYear, i, 1);
      const monthStr = `${currentYear}-${(i + 1).toString().padStart(2, '0')}`;
      const shortName = d.toLocaleString('default', { month: 'short' });

      tabs.push({
        id: monthStr,
        label: `${shortName} ${currentYear}`
      });
    }
    return tabs; // Jan to Dec
  }, []);

  const heatmapDays = useMemo(() => {
    const days = [];
    if (!selectedMonthStr) return days;

    const [yearStr, monthStr] = selectedMonthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed

    // Get the first day of the selected month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday

    // Get the number of days in the month
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();

    // Pad the start with nulls to align the 1st day to the correct weekday
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add exactly the days in the month
    for (let i = 1; i <= numDays; i++) {
      // pad start for valid YYYY-MM-DD
      const dayStr = i.toString().padStart(2, '0');
      days.push(`${selectedMonthStr}-${dayStr}`);
    }

    // Pad the end with nulls to complete the last week (optional, but good for consistent grid size)
    const endDayOfWeek = lastDay.getDay();
    if (endDayOfWeek < 6) {
      for (let i = 0; i < 6 - endDayOfWeek; i++) {
        days.push(null);
      }
    }

    return days;
  }, [selectedMonthStr]);

  const calculateScore = (date) => {
    if (!date) return 0;
    const dayData = history[date] || { tags: {}, gym: false };

    let totalStudySeconds = 0;
    if (dayData.tags) {
      Object.values(dayData.tags).forEach(sec => totalStudySeconds += sec);
    }

    const studyHours = totalStudySeconds / 3600;
    // 10 pts per study hour, capped at 80
    const studyScore = Math.min(studyHours * 10, 80);
    // Flat 20 for gym
    const gymScore = dayData.gym ? 20 : 0;

    return studyScore + gymScore;
  };

  const getColorClass = (score) => {
    if (score === 0) return 'bg-slate-800 hover:bg-slate-700 border-slate-700/50';
    if (score <= 30) return 'bg-red-500 hover:bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)] border-transparent';
    if (score <= 59) return 'bg-yellow-500 hover:bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.4)] border-transparent';
    if (score <= 85) return 'bg-green-400 hover:bg-green-300 shadow-[0_0_8px_rgba(74,222,128,0.4)] border-transparent';
    return 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)] border-transparent';
  };

  const getColorTextClass = (score) => {
    if (score === 0) return 'text-slate-500';
    if (score <= 30) return 'text-red-500';
    if (score <= 59) return 'text-yellow-500';
    if (score <= 85) return 'text-green-400';
    return 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  };

  const getWeekLabels = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
      <div key={day} className="text-[10px] text-slate-500 h-[18px] flex items-center justify-end pr-2 w-8">
        {day}
      </div>
    ));
  };


  // --- Render ---

  // 1. Timer View
  if (activeTagId && activeTag) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-500 ${isTimerRunning ? 'bg-slate-900' : 'bg-slate-800'}`}>
        <div className="absolute top-10 text-slate-400 text-sm tracking-widest uppercase mb-4">
          Current Focus
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-12 tracking-tight">
          {activeTag.name}
        </h1>
        <div className={`font-mono text-7xl md:text-9xl mb-16 transition-colors duration-300 ${isTimerRunning ? 'text-blue-400' : 'text-amber-400'}`}>
          {formatTime(sessionSeconds)}
        </div>
        <div className="flex items-center gap-8">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`p-6 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg ${isTimerRunning
              ? 'bg-slate-700 text-amber-400 hover:bg-slate-600'
              : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
          >
            {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          </button>
          <button
            onClick={handleEndSession}
            className={`group p-6 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center overflow-hidden relative ${showEndConfirm ? 'bg-red-600 text-white w-auto px-8' : 'bg-slate-700 text-slate-300 hover:bg-red-900/50 hover:text-red-400'
              }`}
          >
            {showEndConfirm ? (
              <span className="font-bold text-lg whitespace-nowrap animate-pulse">Confirm End?</span>
            ) : (
              <Square size={32} fill="currentColor" />
            )}
          </button>
        </div>
        <div className="absolute bottom-10 text-slate-500 text-sm">
          {isTimerRunning ? 'Tracking time...' : 'Timer paused'}
        </div>
      </div>
    );
  }

  // 2. Dashboard View
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-10 lg:p-12 relative overflow-x-hidden flex flex-col">
      {/* Main Content Wrapper */}
      <div className={`flex-1 min-w-0 w-full transition-all duration-300 ${selectedDate ? 'md:mr-96' : ''}`}>
        <div className="max-w-6xl mx-auto z-10 relative">

          <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 mb-2 tracking-tight">
                Study Volume
              </h1>
              <p className="text-slate-400 text-sm font-medium tracking-wide">Track your effort, not your tasks.</p>
            </div>
          </header>

          {/* Subjects Grid */}
          <section className="mb-16">
            <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Clock className="text-blue-500 w-5 h-5" />
              Study Topics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Tag Cards */}
              {tags.map(tag => (
                <div
                  key={tag.id}
                  onClick={() => handleStartSession(tag.id)}
                  className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all cursor-pointer shadow-sm hover:shadow-blue-900/20 flex flex-col justify-between h-36"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors truncate pr-8">
                      {tag.name}
                    </h2>
                  </div>

                  <div className="flex items-end gap-1.5 align-bottom mt-auto">
                    <span className="text-3xl font-light text-blue-400 leading-none">
                      {Math.floor(tag.totalSeconds / 3600)}
                    </span>
                    <span className="text-slate-500 text-sm pb-1 mr-1">h</span>

                    <span className="text-2xl font-light text-slate-300 leading-none">
                      {Math.floor((tag.totalSeconds % 3600) / 60)}
                    </span>
                    <span className="text-slate-500 text-sm pb-1 mr-1">m</span>

                    <span className="text-lg font-light text-slate-500 leading-none">
                      {tag.totalSeconds % 60}
                    </span>
                    <span className="text-slate-600 text-sm pb-1">s</span>
                  </div>

                  {/* Play Hover Icon */}
                  <div className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 bg-blue-500/10 rounded-full">
                    <Play size={16} fill="currentColor" />
                  </div>

                  {/* Delete Button */}
                  <div
                    onClick={(e) => handleDeleteTag(e, tag.id)}
                    className="absolute bottom-4 right-4 text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete Topic"
                  >
                    <Trash2 size={16} />
                  </div>
                </div>
              ))}

              {/* Create New Card */}
              {isCreating ? (
                <form onSubmit={handleCreateTag} className="bg-slate-900/30 border border-dashed border-slate-700/60 rounded-2xl p-5 flex flex-col justify-center items-center gap-3 h-36">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Topic Name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onBlur={() => !newTagName && setIsCreating(false)}
                    className="bg-transparent border-b border-slate-600 text-center text-lg text-white focus:outline-none focus:border-blue-500 w-full pb-1"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-xs font-semibold hover:bg-blue-500 transition-colors w-full"
                  >
                    Create
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-5 flex flex-col justify-center items-center gap-3 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-slate-900/40 transition-all group h-36"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="font-medium text-sm">New Topic</span>
                </button>
              )}
            </div>
          </section>

          {/* Productivity Heatmap */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Activity className="text-emerald-500 w-5 h-5" />
              Productivity Heatmap
            </h2>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm relative overflow-hidden group">

              {/* Month Tabs */}
              <div className="relative w-full h-10 mb-6 border-b border-slate-800/60">
                <div className="absolute inset-x-0 top-0 overflow-x-auto scrollbar-hide custom-scrollbar-hide h-12 flex">
                  <div className="flex gap-2 w-max pr-6 items-start h-10">
                    {monthTabs.map((tab) => {
                      const isActive = tab.id === selectedMonthStr;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedMonthStr(tab.id)}
                          className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-colors shrink-0 ${isActive
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                            }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto pb-4 scrollbar-hide w-full">
                <div className="min-w-max flex gap-3">
                  {/* Y-axis days */}
                  <div className="grid grid-rows-7 gap-3">
                    {getWeekLabels()}
                  </div>

                  {/* Grid */}
                  <div className="grid grid-rows-7 grid-flow-col gap-3">
                    {heatmapDays.map((date, index) => {
                      if (!date) return <div key={`empty-${index}`} className="w-[18px] h-[18px] rounded-[4px] opacity-0" />;
                      const score = calculateScore(date);
                      const isSelected = selectedDate === date;

                      // Check if it's the current local day to give it a special outline
                      const d = new Date();
                      const todayLocalStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                      const isToday = date === todayLocalStr;

                      return (
                        <div
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`w-[18px] h-[18px] rounded-[4px] border cursor-pointer transition-all duration-300
                            ${getColorClass(score)}
                            ${isSelected ? 'ring-2 ring-white scale-125 z-10' : ''}
                            ${!isSelected && isToday ? 'ring-2 ring-blue-500/70 border-none' : 'hover:scale-125 hover:z-10 hover:border-slate-600'}
                            ${!isSelected && !isToday ? 'border-slate-800/50' : ''}
                          `}
                          title={`${date}: ${Math.round(score)} pts`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                <div className="text-xs text-slate-500 font-medium tracking-wide text-center sm:text-left">
                  Top score captures study + physical training.
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 font-medium">
                  <span>Less</span>
                  <div className="flex gap-1.5 ml-1 mr-1">
                    <div className="w-[14px] h-[14px] rounded-[3px] border border-slate-700/50 bg-slate-800"></div>
                    <div className="w-[14px] h-[14px] rounded-[3px] border border-transparent bg-red-500"></div>
                    <div className="w-[14px] h-[14px] rounded-[3px] border border-transparent bg-yellow-500"></div>
                    <div className="w-[14px] h-[14px] rounded-[3px] border border-transparent bg-green-400"></div>
                    <div className="w-[14px] h-[14px] rounded-[3px] border border-transparent bg-emerald-500"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Side Panel Overlay Backdrop for Mobile */}
      {selectedDate && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSelectedDate(null)}
        />
      )}

      {/* Analytics Side Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-slate-950/95 backdrop-blur-xl border-l border-slate-800/80 shadow-2xl z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${selectedDate ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedDate && (
          <div className="h-full flex flex-col pt-8 pb-6 px-6 md:px-8 overflow-y-auto scrollbar-hide">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Daily Outline
                </h2>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  {new Date(new Date(selectedDate).getTime() + new Date().getTimezoneOffset() * 60000).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2.5 text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center py-10 bg-gradient-to-b from-slate-900/80 to-slate-900/20 rounded-3xl border border-slate-800/80 mb-8 relative overflow-hidden">
              {/* Decorative glow */}
              <div className={`absolute -inset-4 bg-gradient-to-r ${getColorClass(calculateScore(selectedDate)).split(' ')[0]} opacity-10 blur-2xl rounded-full`}></div>

              <div className={`text-8xl font-black mb-1 tabular-nums tracking-tighter ${getColorTextClass(calculateScore(selectedDate))}`}>
                {Math.round(calculateScore(selectedDate))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-500 uppercase tracking-widest text-[11px] font-bold">Total Power Score</span>
              </div>
            </div>

            {/* Gym Control */}
            <div className="flex items-center justify-between p-5 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl mb-10 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${history[selectedDate]?.gym ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Dumbbell size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-slate-200">Physical Training</div>
                  <div className="text-[13px] text-slate-500 mt-0.5">Earns +20 point bonus</div>
                </div>
              </div>

              <button
                onClick={() => handleToggleGym(selectedDate)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
                  ${history[selectedDate]?.gym ? 'bg-indigo-500' : 'bg-slate-700'}
                `}
                role="switch"
                aria-checked={history[selectedDate]?.gym || false}
              >
                <span className="sr-only">Toggle physical training</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${history[selectedDate]?.gym ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Distribution */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 size={16} />
                  Learning Distribution
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                  {formatTotalTime(Object.values(history[selectedDate]?.tags || {}).reduce((acc, curr) => acc + curr, 0))}
                </span>
              </div>

              <div className="space-y-6">
                {tags.map(tag => {
                  const seconds = history[selectedDate]?.tags?.[tag.id] || 0;
                  if (seconds === 0) return null;
                  const hours = seconds / 3600;
                  const maxHours = Math.max(...tags.map(t => (history[selectedDate]?.tags?.[t.id] || 0) / 3600), 0.5); // Provide 0.5h minimum max
                  const width = `${Math.min((hours / maxHours) * 100, 100)}%`;

                  return (
                    <div key={tag.id} className="group">
                      <div className="flex justify-between text-[13px] mb-2 font-medium">
                        <span className="text-slate-300 group-hover:text-blue-400 transition-colors">{tag.name}</span>
                        <span className="text-slate-500 ">{formatTotalTime(seconds)} • {Math.round((seconds / 3600) * 10) / 10}h</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width }}></div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty state */}
                {(!history[selectedDate]?.tags || Object.keys(history[selectedDate].tags).length === 0 || Object.values(history[selectedDate].tags).every(s => s === 0)) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <Clock size={32} className="text-slate-700 mb-3" />
                    <p className="text-slate-500 text-sm font-medium">No learning logged.</p>
                    <p className="text-slate-600 text-xs mt-1">Start a timer from the dashboard.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {tagToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setTagToDelete(null)}
          ></div>

          <div className="relative bg-slate-900 rounded-2xl p-8 max-w-sm w-full border border-slate-700/50 shadow-2xl transform scale-100 transition-all">
            <button
              onClick={() => setTagToDelete(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors"
            >
              <X size={16} />
            </button>

            <div className="text-center pt-2">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Delete Topic?</h3>
              <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                You are about to delete <span className="text-slate-200 font-semibold">{tagToDelete.name}</span>. The timer history will remain in the heatmap, but you won't be able to log it anymore.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setTagToDelete(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
