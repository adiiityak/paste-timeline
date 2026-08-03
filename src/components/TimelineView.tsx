import React, { useState } from "react";
import {
  Pin,
  Trash2,
  FolderPlus,
  LayoutGrid,
  ListFilter,
  Layers,
  Sparkles,
  SearchX,
  X,
  CheckSquare,
  Square,
  PlusCircle,
} from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";
import { ClipCard } from "./ClipCard";
import { ClipboardType } from "../types/clipboard";

export const TimelineView: React.FC = () => {
  const {
    items,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    searchQuery,
    selectedCollectionId,
    setSelectedCollectionId,
    selectedTag,
    setSelectedTag,
    selectedItemIds,
    toggleItemSelection,
    selectAllVisibleItems,
    clearSelection,
    bulkDeleteSelected,
    bulkAssignSelectedCollection,
    collections,
    setIsSimulatorOpen,
  } = useClipboardStore();

  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");

  // 1. Filter items according to searchQuery, typeFilter, dateFilter, selectedCollectionId, selectedTag
  const filteredItems = items.filter((item) => {
    // Search query match
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = item.content.toLowerCase().includes(q);
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
      const matchOcr = item.ocr_text ? item.ocr_text.toLowerCase().includes(q) : false;
      const matchTitle = item.metadata.aiTitle ? item.metadata.aiTitle.toLowerCase().includes(q) : false;
      const matchApp = item.app_name ? item.app_name.toLowerCase().includes(q) : false;
      if (!matchContent && !matchTag && !matchOcr && !matchTitle && !matchApp) {
        return false;
      }
    }

    // Type filter
    if (typeFilter !== "all" && item.type !== typeFilter) {
      return false;
    }

    // Collection filter
    if (selectedCollectionId && item.collection !== selectedCollectionId) {
      return false;
    }

    // Tag filter
    if (selectedTag && !item.tags.includes(selectedTag)) {
      return false;
    }

    // Date filter
    if (dateFilter !== "all") {
      const itemDate = new Date(item.created_at);
      const today = new Date();
      if (dateFilter === "today") {
        if (itemDate.toDateString() !== today.toDateString()) return false;
      } else if (dateFilter === "yesterday") {
        const yest = new Date();
        yest.setDate(today.getDate() - 1);
        if (itemDate.toDateString() !== yest.toDateString()) return false;
      } else if (dateFilter === "week") {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (item.created_at < weekAgo) return false;
      }
    }

    return true;
  });

  const pinnedItems = filteredItems.filter((i) => i.pinned);
  const unpinnedItems = filteredItems.filter((i) => !i.pinned);

  const typeOptions: { id: string; label: string }[] = [
    { id: "all", label: "All Types" },
    { id: "code", label: "Code" },
    { id: "json", label: "JSON" },
    { id: "hex", label: "Colors" },
    { id: "url", label: "URLs" },
    { id: "image", label: "Images" },
    { id: "sql", label: "SQL" },
    { id: "filepath", label: "File Paths" },
  ];

  const dateOptions: { id: "all" | "today" | "yesterday" | "week"; label: string }[] = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "Last 7 Days" },
  ];

  const handleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      clearSelection();
    } else {
      selectAllVisibleItems(filteredItems.map((i) => i.id));
    }
  };

  const activeCollectionObj = collections.find((c) => c.id === selectedCollectionId);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0b] overflow-y-auto p-4 space-y-4 transition-colors duration-150">
      {/* Active Filter Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#111113] p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {typeOptions.map((opt) => {
            const isSelected = typeFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTypeFilter(opt.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-zinc-800 text-white dark:bg-zinc-800 dark:text-white font-medium"
                    : "bg-transparent text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* View Mode & Date Filter Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
          {/* Date Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-300 dark:border-zinc-800">
            {dateOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDateFilter(opt.id)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded transition-all ${
                  dateFilter === opt.id
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Compact vs Card Toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-300 dark:border-zinc-800">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "cards" ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded transition-all ${
                viewMode === "compact" ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
              title="Compact List View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Collection / Tag Notice */}
      {(activeCollectionObj || selectedTag) && (
        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 p-2.5 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              Showing filter:{" "}
              {activeCollectionObj && (
                <strong className="text-zinc-900 dark:text-white font-semibold">Collection: {activeCollectionObj.name}</strong>
              )}
              {selectedTag && <strong className="text-zinc-900 dark:text-white font-semibold">Tag: #{selectedTag}</strong>}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedCollectionId(null);
              setSelectedTag(null);
            }}
            className="text-indigo-700 dark:text-indigo-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-500/30"
          >
            <X className="w-3.5 h-3.5" /> Reset Filter
          </button>
        </div>
      )}

      {/* Bulk Select Toolbar */}
      {selectedItemIds.length > 0 && (
        <div className="sticky top-2 z-20 flex items-center justify-between bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-600/20 border border-indigo-400/40 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 px-2.5 py-1 rounded-lg"
            >
              {selectedItemIds.length === filteredItems.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedItemIds.length} of {filteredItems.length} selected
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Assign Collection Dropdown */}
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val !== "") {
                  bulkAssignSelectedCollection(val === "none" ? null : val);
                }
              }}
              className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium px-2.5 py-1 rounded-lg border border-indigo-500 focus:outline-none"
            >
              <option value="">Move to Collection...</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="none">Remove Collection</option>
            </select>

            <button
              onClick={bulkDeleteSelected}
              className="flex items-center gap-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={clearSelection}
              className="p-1 hover:bg-indigo-700 rounded-lg text-indigo-200"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Timeline List Content */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <SearchX className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">No Clipboard Items Found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Copy any text, code, URL, image, or hex color to populate your timeline, or test with the Tester injector.
            </p>
          </div>
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Inject Sample Clipboard Data</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Items Section */}
          {pinnedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 px-1">
                <Pin className="w-3.5 h-3.5 fill-amber-400" />
                <span>Pinned Items ({pinnedItems.length})</span>
              </div>
              <div
                className={
                  viewMode === "cards"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "space-y-2"
                }
              >
                {pinnedItems.map((item) => (
                  <ClipCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.includes(item.id)}
                    onSelectToggle={() => toggleItemSelection(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unpinned Timeline Stream */}
          {unpinnedItems.length > 0 && (
            <div className="space-y-3">
              {pinnedItems.length > 0 && (
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">
                  <span>Recent Timeline</span>
                </div>
              )}
              <div
                className={
                  viewMode === "cards"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "space-y-2"
                }
              >
                {unpinnedItems.map((item) => (
                  <ClipCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemIds.includes(item.id)}
                    onSelectToggle={() => toggleItemSelection(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
