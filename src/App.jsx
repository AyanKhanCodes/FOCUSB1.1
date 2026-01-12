import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Trash2, Clock, AlertCircle, X } from 'lucide-react';

// Utility to format seconds into HH:MM:SS
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Simplified parser for HH:MM (user requirement mentioned "Total Time" but formatted)
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
      { id: '1', name: 'Python', totalSeconds: 0 },
      { id: '2', name: 'DSA', totalSeconds: 0 },
      { id: '3', name: 'Math', totalSeconds: 0 },
    ];
  });

  // Active Session State
  const [activeTagId, setActiveTagId] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // New Tag Inpur
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Delete Modal State
  const [tagToDelete, setTagToDelete] = useState(null);

  const timerRef = useRef(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('study-tags', JSON.stringify(tags));
  }, [tags]);

  // --- Timer Logic ---
  useEffect(() => {
    if (isTimerRunning && activeTagId) {
      timerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
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
    // Replaced window.confirm with custom modal state
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

    // Confirmed end
    setTags(tags.map(tag => {
      if (tag.id === activeTagId) {
        return { ...tag, totalSeconds: tag.totalSeconds + sessionSeconds };
      }
      return tag;
    }));

    // Reset
    setIsTimerRunning(false);
    setActiveTagId(null);
    setSessionSeconds(0);
    setShowEndConfirm(false);
  };

  const activeTag = tags.find(t => t.id === activeTagId);

  // --- Render ---

  // 1. Timer View
  if (activeTagId && activeTag) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-500 ${isTimerRunning ? 'bg-slate-900' : 'bg-slate-800'}`}>

        {/* Header / Back indication is implicit by "End Session" but let's show Tag Name */}
        <div className="absolute top-10 text-slate-400 text-sm tracking-widest uppercase mb-4">
          Current Focus
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-12 tracking-tight">
          {activeTag.name}
        </h1>

        {/* Timer Display */}
        <div className={`font-mono text-7xl md:text-9xl mb-16 transition-colors duration-300 ${isTimerRunning ? 'text-blue-400' : 'text-amber-400'}`}>
          {formatTime(sessionSeconds)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
          {/* Pause/Resume */}
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`p-6 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg ${isTimerRunning
              ? 'bg-slate-700 text-amber-400 hover:bg-slate-600'
              : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
          >
            {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          </button>

          {/* End Session */}
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

        {/* Session Status Text */}
        <div className="absolute bottom-10 text-slate-500 text-sm">
          {isTimerRunning ? 'Tracking time...' : 'Timer paused'}
        </div>
      </div>
    );
  }

  // 2. Dashboard View
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-12 relative overflow-hidden">
      <div className="max-w-5xl mx-auto z-10 relative">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Study Volume</h1>
            <p className="text-slate-500 text-sm">Track your effort, not your tasks.</p>
          </div>
          {/* Total Logic could go here, e.g. "Total Hours Study: 100h" */}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tag Cards */}
          {tags.map(tag => (
            <div
              key={tag.id}
              onClick={() => handleStartSession(tag.id)}
              className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-slate-900 transition-all cursor-pointer shadow-sm hover:shadow-blue-900/20"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {tag.name}
                </h2>
              </div>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-light text-blue-400">
                  {Math.floor(tag.totalSeconds / 3600)}
                </span>
                <span className="text-slate-500 mb-1">h</span>

                <span className="text-2xl font-light text-slate-400 ml-2">
                  {Math.floor((tag.totalSeconds % 3600) / 60)}
                </span>
                <span className="text-slate-600 mb-1">m</span>

                {/* Seconds display for precision (fixes "0h 0m" issue for short sessions) */}
                <span className="text-xl font-light text-slate-500 ml-2">
                  {tag.totalSeconds % 60}
                </span>
                <span className="text-slate-700 mb-1">s</span>
              </div>

              {/* Play Hover Icon (Top Right) */}
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                <Play size={20} fill="currentColor" />
              </div>

              {/* Delete Button (Bottom Right) */}
              <div
                onClick={(e) => handleDeleteTag(e, tag.id)}
                className="absolute bottom-4 right-4 text-slate-700 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Delete Topic"
              >
                <Trash2 size={18} />
              </div>
            </div>
          ))}

          {/* Create New Card */}
          {isCreating ? (
            <form onSubmit={handleCreateTag} className="bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-6 flex flex-col justify-center items-center gap-4">
              <input
                autoFocus
                type="text"
                placeholder="Topic Name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onBlur={() => !newTagName && setIsCreating(false)}
                className="bg-transparent border-b border-slate-600 text-center text-xl text-white focus:outline-none focus:border-blue-500 w-full pb-2"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Create
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-6 flex flex-col justify-center items-center gap-4 text-slate-600 hover:text-blue-400 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-medium">New Topic</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {tagToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setTagToDelete(null)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-slate-900 rounded-2xl p-8 max-w-sm w-full border border-slate-800 shadow-2xl transform scale-100 transition-all">
            <button
              onClick={() => setTagToDelete(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Delete {tagToDelete.name}?</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                This action cannot be undone. All study history for this topic will be lost forever.
              </p>

              <button
                onClick={confirmDelete}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-4 shadow-lg shadow-indigo-500/20"
              >
                Delete Forever
              </button>

              {/* Optional: Checkbox style requirement from image? The image had a checkbox, but for delete, just main button is better.
                  However, I'll stick to clear actions. */}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
