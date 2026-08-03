import React, { useState } from "react";
import { ShieldAlert, Lock, EyeOff, Plus, Trash2, CheckCircle, ShieldCheck } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";

export const PrivacyView: React.FC = () => {
  const { settings, updateSettings, showToast } = useClipboardStore();
  const [newApp, setNewApp] = useState("");

  const handleAddExcludedApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newApp.trim()) {
      const appName = newApp.trim();
      if (!settings.excludedApps.includes(appName)) {
        updateSettings({
          excludedApps: [...settings.excludedApps, appName],
        });
        showToast(`Added ${appName} to privacy exclusions`);
      }
      setNewApp("");
    }
  };

  const handleRemoveExcludedApp = (appName: string) => {
    updateSettings({
      excludedApps: settings.excludedApps.filter((a) => a !== appName),
    });
    showToast(`Removed ${appName} from privacy exclusions`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0b] overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Privacy & Security Guard</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Never log sensitive credentials, passwords & 6-digit OTPs</p>
          </div>
        </div>
      </div>

      {/* Masking Rules Settings */}
      <div className="bg-white dark:bg-[#111113] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Auto-Masking & Protection Rules
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#0a0a0b] rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-0.5">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Mask Passwords & Secrets</span>
              <p className="text-[11px] text-zinc-500">Automatically hide passwords and high-entropy text</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maskSensitiveData}
              onChange={(e) => updateSettings({ maskSensitiveData: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0a0a0b]"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#0a0a0b] rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-0.5">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">6-Digit OTP Security Codes</span>
              <p className="text-[11px] text-zinc-500">Mask 2FA SMS and email verification codes</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#0a0a0b] rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-0.5">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Credit Card Numbers (Luhn Check)</span>
              <p className="text-[11px] text-zinc-500">Mask Visa, Mastercard, Amex, Discover card numbers</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Excluded Password Managers / Incognito Applications */}
      <div className="bg-white dark:bg-[#111113] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
          Excluded Password Managers & Private Apps
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Clipboard copies originating from these source applications will be automatically ignored by PasteTimeline.
        </p>

        <form onSubmit={handleAddExcludedApp} className="flex gap-2">
          <input
            type="text"
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
            placeholder="e.g. Bitwarden, 1Password, KeePass, Incognito Chrome"
            className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add App</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {settings.excludedApps.map((appName) => (
            <span
              key={appName}
              className="inline-flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-500/20 font-medium"
            >
              <span>{appName}</span>
              <button
                onClick={() => handleRemoveExcludedApp(appName)}
                className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
