import React from "react";
import { BarChart3, TrendingUp, Copy, Shield, Layers, AppWindow } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";

export const AnalyticsView: React.FC = () => {
  const { items } = useClipboardStore();

  const totalCopies = items.reduce((sum, item) => sum + (item.copy_count || 1), 0);
  const sensitiveCount = items.filter((i) => i.metadata.isSensitive).length;

  // Breakdown by type
  const typeCounts: Record<string, number> = {};
  items.forEach((i) => {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
  });

  // Top source applications
  const appCounts: Record<string, number> = {};
  items.forEach((i) => {
    const app = i.app_name || "Unknown";
    appCounts[app] = (appCounts[app] || 0) + 1;
  });

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const sortedApps = Object.entries(appCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0b] overflow-y-auto p-4 space-y-4 transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Clipboard Analytics & Journey</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Insights on copying frequency, top formats & source applications</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Total Items Captured
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{items.length}</div>
        </div>

        <div className="bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Total Re-Copies
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{totalCopies}</div>
        </div>

        <div className="bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Protected Items
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{sensitiveCount}</div>
        </div>

        <div className="bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Unique Content Types
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{sortedTypes.length}</div>
        </div>
      </div>

      {/* Charts / Visual Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Content Type Distribution */}
        <div className="bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
            Content Type Breakdown
          </h3>
          <div className="space-y-2">
            {sortedTypes.map(([type, count]) => {
              const pct = items.length ? Math.round((count / items.length) * 100) : 0;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-zinc-700 dark:text-zinc-300">
                    <span className="uppercase">{type}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 dark:bg-[#0a0a0b] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Source Apps */}
        <div className="bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 tracking-wider flex items-center gap-1.5">
            <AppWindow className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Top Source Applications
          </h3>
          <div className="space-y-2">
            {sortedApps.map(([app, count]) => {
              const pct = items.length ? Math.round((count / items.length) * 100) : 0;
              return (
                <div key={app} className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-[#0a0a0b] rounded-md border border-zinc-200 dark:border-zinc-800 text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{app}</span>
                  <span className="font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                    {count} clips ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
