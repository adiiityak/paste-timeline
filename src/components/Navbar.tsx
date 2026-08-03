import React from "react";
import {
  ClipboardList,
  Search,
  Sparkles,
  Zap,
  Moon,
  Sun,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  SlidersHorizontal,
  Command,
  Apple,
} from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";

export const Navbar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    isMonitoring,
    toggleMonitoring,
    isSimulatorOpen,
    setIsSimulatorOpen,
    setIsQuickPasteOpen,
    setIsMacModalOpen,
    settings,
    updateSettings,
    items,
  } = useClipboardStore();

  const handleThemeToggle = () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    updateSettings({ theme: nextTheme });
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const sensitiveCount = items.filter((i) => i.metadata.isSensitive).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#0a0a0b]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between shadow-sm transition-colors duration-150">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30 flex items-center justify-center font-bold text-white text-base">
          P
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
              Paste<span className="text-indigo-600 dark:text-indigo-400">Timeline</span>
            </h1>
            <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              v1.2
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
            Clipboard history & smart timeline
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history (Ctrl+F)..."
            className="w-full pl-9 pr-12 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <div className="absolute right-2.5 top-2 flex items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
            <Command className="w-3 h-3" /> F
          </div>
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center gap-2">
        {/* macOS Desktop App Launcher */}
        <button
          onClick={() => setIsMacModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-all shadow-md"
          title="Install as macOS App or Build macOS .dmg"
        >
          <Apple className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Mac App</span>
        </button>

        {/* Quick Paste Overlay Trigger */}
        <button
          onClick={() => setIsQuickPasteOpen(true)}
          className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 transition-all shadow-sm"
          title="Open Quick Paste Overlay (Ctrl/Cmd + Shift + V)"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Quick Paste</span>
          <kbd className="ml-1 text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
            {settings.hotkey}
          </kbd>
        </button>

        {/* Live Simulator Toggle */}
        <button
          onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-all ${
            isSimulatorOpen
              ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 shadow-sm"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
          title="Test Clipboard Injector / Simulator"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="hidden sm:inline">Tester</span>
        </button>

        {/* Monitoring Toggle */}
        <button
          onClick={toggleMonitoring}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-all ${
            isMonitoring
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
          }`}
          title={isMonitoring ? "Clipboard recording active" : "Clipboard recording paused"}
        >
          {isMonitoring ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Live Sync</span>
            </>
          ) : (
            <>
              <PauseCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">Paused</span>
            </>
          )}
        </button>

        {/* Sensitive Protection Badge */}
        {sensitiveCount > 0 && (
          <div
            className="hidden xl:flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-500/20"
            title={`${sensitiveCount} sensitive items auto-protected`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{sensitiveCount} Protected</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-all shadow-sm"
          title="Toggle Dark / Light Theme"
        >
          {settings.theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
};
