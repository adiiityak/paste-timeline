import React, { useState } from "react";
import { Search, History, Filter } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";
import { ClipCard } from "./ClipCard";

export const SearchView: React.FC = () => {
  const { searchQuery, setSearchQuery, items, selectedItemIds, toggleItemSelection } = useClipboardStore();
  const [searchHistory, setSearchHistory] = useState<string[]>([
    "typescript",
    "json",
    "color",
    "api_key",
    "todo",
  ]);
  const [isRegex, setIsRegex] = useState(false);

  const handleSearchSubmit = (queryText: string) => {
    setSearchQuery(queryText);
    if (queryText && !searchHistory.includes(queryText)) {
      setSearchHistory([queryText, ...searchHistory.slice(0, 5)]);
    }
  };

  const results = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    try {
      if (isRegex) {
        const re = new RegExp(searchQuery, "i");
        return (
          re.test(item.content) ||
          re.test(item.ocr_text || "") ||
          re.test(item.metadata.aiTitle || "") ||
          item.tags.some((t) => re.test(t))
        );
      } else {
        const q = searchQuery.toLowerCase();
        return (
          item.content.toLowerCase().includes(q) ||
          (item.ocr_text && item.ocr_text.toLowerCase().includes(q)) ||
          (item.metadata.aiTitle && item.metadata.aiTitle.toLowerCase().includes(q)) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          (item.app_name && item.app_name.toLowerCase().includes(q))
        );
      }
    } catch {
      return false;
    }
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0b] overflow-y-auto p-4 space-y-4 transition-colors duration-150">
      {/* Search Input Card */}
      <div className="bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(searchQuery)}
            placeholder="Search clipboard text, code, OCR text, tags, URLs..."
            className="w-full pl-11 pr-28 py-2.5 bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="absolute right-3 top-2 flex items-center gap-2">
            <button
              onClick={() => setIsRegex(!isRegex)}
              className={`text-xs font-mono font-bold px-2 py-1 rounded border transition-all ${
                isRegex
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
              title="Toggle Regex Mode"
            >
              .* Regex
            </button>
          </div>
        </div>

        {/* Search History Chips */}
        {searchHistory.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-500">
              <History className="w-3.5 h-3.5" /> Recent Queries:
            </span>
            {searchHistory.map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-500 px-1">
          <span>
            Search Hits: {results.length} item{results.length !== 1 ? "s" : ""}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear Search Query
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500 bg-white dark:bg-[#111113] rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            No clipboard history items match your search "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((item) => (
              <ClipCard
                key={item.id}
                item={item}
                isSelected={selectedItemIds.includes(item.id)}
                onSelectToggle={() => toggleItemSelection(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
