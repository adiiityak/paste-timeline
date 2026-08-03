import React from "react";
import {
  Clock,
  Search,
  Star,
  FolderKanban,
  BarChart3,
  Settings,
  ShieldAlert,
  Tag,
  Plus,
  Zap,
  Apple,
} from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";
import { ViewTab } from "../types/clipboard";

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    items,
    collections,
    selectedCollectionId,
    setSelectedCollectionId,
    selectedTag,
    setSelectedTag,
    setIsQuickPasteOpen,
    setIsMacModalOpen,
    createCollection,
  } = useClipboardStore();

  const favCount = items.filter((i) => i.favorite || i.pinned).length;

  // Extract all unique tags across items
  const allTags = Array.from(
    new Set(items.flatMap((item) => item.tags || []))
  ).slice(0, 8);

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "timeline", label: "Timeline", icon: <Clock className="w-4 h-4" />, count: items.length },
    { id: "search", label: "FTS Search", icon: <Search className="w-4 h-4" /> },
    { id: "favorites", label: "Starred & Pinned", icon: <Star className="w-4 h-4 text-amber-400" />, count: favCount },
    { id: "collections", label: "Collections", icon: <FolderKanban className="w-4 h-4 text-indigo-400" />, count: collections.length },
    { id: "analytics", label: "Analytics & Journey", icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "privacy", label: "Privacy Rules", icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
  ];

  const handleCreateQuickCollection = () => {
    setActiveTab("collections");
  };

  return (
    <aside className="w-60 bg-zinc-100 dark:bg-[#111113] border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between p-3 select-none shrink-0 transition-colors duration-150">
      <div className="space-y-6">
        {/* Main Navigation Links */}
        <nav className="space-y-1">
          <div className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-500 tracking-wider px-3 mb-2">
            Workspace
          </div>
          {navItems.map((nav) => {
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => {
                  setActiveTab(nav.id);
                  if (nav.id === "timeline") {
                    setSelectedCollectionId(null);
                    setSelectedTag(null);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {nav.icon}
                  <span>{nav.label}</span>
                </div>
                {nav.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      isActive
                        ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                        : "bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500"
                    }`}
                  >
                    {nav.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collections Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 text-[10px] uppercase font-medium tracking-wider text-zinc-500">
            <span>Collections</span>
            <button
              onClick={handleCreateQuickCollection}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
              title="Add Collection"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1 text-xs">
            {collections.map((col) => {
              const count = items.filter((i) => i.collection === col.id).length;
              const isSelected = selectedCollectionId === col.id && activeTab === "timeline";

              return (
                <button
                  key={col.id}
                  onClick={() => {
                    setSelectedCollectionId(isSelected ? null : col.id);
                    setActiveTab("timeline");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span className="truncate">{col.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-1.5 py-0.2 rounded">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tag Cloud Section */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 text-[10px] uppercase font-medium tracking-wider text-zinc-500">
              <span>Tags Filter</span>
              <Tag className="w-3 h-3 text-zinc-500" />
            </div>
            <div className="flex flex-wrap gap-1 px-2">
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag && activeTab === "timeline";
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(isSelected ? null : tag);
                      setActiveTab("timeline");
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                      isSelected
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/50 font-medium"
                        : "bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Storage / Quick Paste & macOS App Floating Widgets */}
      <div className="space-y-2">
        {/* macOS Desktop App Button */}
        <button
          onClick={() => setIsMacModalOpen(true)}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-md transition-all group"
        >
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4 fill-current text-white dark:text-zinc-900" />
            <span>macOS App Hub</span>
          </div>
          <span className="text-[10px] bg-white/20 dark:bg-zinc-900/10 px-1.5 py-0.5 rounded font-mono">
            Native
          </span>
        </button>

        {/* Quick Paste Widget */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-800 dark:text-zinc-300 font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Quick Paste
          </span>
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">&lt;5s</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
          Press shortcut anywhere to summon floating overlay.
        </p>
        <button
          onClick={() => setIsQuickPasteOpen(true)}
          className="w-full py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow transition-all flex items-center justify-center gap-1"
        >
          Open Quick Paste
        </button>
        </div>
      </div>
    </aside>
  );
};
