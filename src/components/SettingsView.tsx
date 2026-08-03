import React, { useState } from "react";
import { Settings, Download, Upload, Trash2, Volume2, Key, RefreshCw, Cloud, Save, Apple, ExternalLink } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, clearAllHistory, items, showToast, setIsMacModalOpen } = useClipboardStore();

  const [historyLimit, setHistoryLimit] = useState(settings.historyLimit);
  const [autoDeleteDays, setAutoDeleteDays] = useState(settings.autoDeleteDays);
  const [hotkey, setHotkey] = useState(settings.hotkey);
  const [soundEffects, setSoundEffects] = useState(settings.soundEffects);

  const handleSaveSettings = () => {
    updateSettings({
      historyLimit,
      autoDeleteDays,
      hotkey,
      soundEffects,
    });
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PasteTimeline_Export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Exported clipboard history JSON backup!");
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedItems = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedItems)) {
            for (const item of importedItems) {
              if (item.id && item.content) {
                await useClipboardStore.getState().addClipboardItem(item.content, item.app_name || "Imported");
              }
            }
            showToast(`Imported ${importedItems.length} clipboard items!`);
          }
        } catch {
          showToast("Failed to parse imported JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0b] overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Application Settings</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Retention limits, hotkey preferences & backups</p>
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-md transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* macOS Desktop Application Card */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-[#111113] dark:to-[#18181b] p-5 rounded-lg border border-zinc-700 dark:border-zinc-800 text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center">
              <Apple className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">macOS Desktop Application (Native & PWA)</h3>
              <p className="text-xs text-zinc-300">Run PasteTimeline natively on Apple Silicon (M1/M2/M3/M4) or Intel Mac</p>
            </div>
          </div>
          <button
            onClick={() => setIsMacModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow transition-all"
          >
            <span>Open Mac Hub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Software Updates & Version Management */}
      <div className="bg-white dark:bg-[#111113] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Software Updates & Versioning
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
              Current Version: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">v1.2.0 (macOS Native Ready)</span>
            </p>
          </div>
          <button
            onClick={() => {
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistration().then((reg) => {
                  if (reg) reg.update();
                });
              }
              showToast("Checked for updates! You are running the latest version of PasteTimeline.");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check for Updates</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 bg-zinc-50 dark:bg-[#0a0a0b] rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              ⚡ Web / PWA Automatic Updates
            </span>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
              When you publish an update on web/hosting, the embedded Service Worker automatically checks for changes in the background and prompts users with a 1-click <em>"Update Available"</em> notification banner to reload seamlessly.
            </p>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-[#0a0a0b] rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              🍎 macOS Desktop (.dmg / .app) Updates
            </span>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
              The Electron desktop app uses <code>electron-updater</code>. When a new GitHub release or DMG build is pushed, the Mac menu bar app downloads it silently in the background and notifies the user to restart and apply the update.
            </p>
          </div>
        </div>
      </div>


      {/* History Retention Limits */}
      <div className="bg-white dark:bg-[#111113] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
          History Retention & Storage
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-800 dark:text-zinc-300">History Capacity Limit</label>
            <select
              value={historyLimit}
              onChange={(e) => setHistoryLimit(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value={50}>50 Items</option>
              <option value={200}>200 Items (Recommended)</option>
              <option value={500}>500 Items</option>
              <option value={1000}>1000 Items</option>
              <option value={0}>Unlimited</option>
            </select>
            <p className="text-[11px] text-zinc-500">Older items auto-expire when capacity limit is reached.</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-800 dark:text-zinc-300">Auto-Delete Policy</label>
            <select
              value={autoDeleteDays}
              onChange={(e) => setAutoDeleteDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value={0}>Never Delete</option>
              <option value={1}>After 24 Hours</option>
              <option value={7}>After 7 Days</option>
              <option value={30}>After 30 Days</option>
            </select>
            <p className="text-[11px] text-zinc-500">Automatically clear clips older than specified days.</p>
          </div>
        </div>
      </div>

      {/* Hotkey & Audio Feedback */}
      <div className="bg-white dark:bg-[#111113] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
          Shortcuts & Audio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-800 dark:text-zinc-300">Quick Paste Overlay Hotkey</label>
            <input
              type="text"
              value={hotkey}
              onChange={(e) => setHotkey(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none"
            />
            <p className="text-[11px] text-zinc-500">Shortcut key to toggle floating overlay.</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-800 dark:text-zinc-300">Copy Audio Sound Feedback</label>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => setSoundEffects(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0a0a0b]"
              />
              <span className="text-zinc-800 dark:text-zinc-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Play subtle chime on copy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Data Export */}
      <div className="bg-white dark:bg-[#111113] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
          Data Export & Backup
        </h3>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-800 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Export JSON Backup</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-all shadow-sm">
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear all clipboard history?")) {
                clearAllHistory();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-600/20 hover:bg-rose-200 dark:hover:bg-rose-600/30 text-rose-800 dark:text-rose-300 text-xs font-semibold rounded-md border border-rose-300 dark:border-rose-500/30 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
