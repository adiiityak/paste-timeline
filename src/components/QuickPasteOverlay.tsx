import React, { useState, useEffect } from "react";
import { Zap, Search, X, Check, Copy, Command, Star, ArrowDown, ArrowUp } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";

export const QuickPasteOverlay: React.FC = () => {
  const { isQuickPasteOpen, setIsQuickPasteOpen, items, copyItemToClipboard } = useClipboardStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.content.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)) ||
      (item.metadata.aiTitle && item.metadata.aiTitle.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global Hotkey Listener (Ctrl/Cmd + Shift + V or Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "V" || e.key === "v")) {
        e.preventDefault();
        setIsQuickPasteOpen(!isQuickPasteOpen);
      }

      if (isQuickPasteOpen) {
        if (e.key === "Escape") {
          setIsQuickPasteOpen(false);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
        } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
          e.preventDefault();
          const target = filteredItems[selectedIndex];
          copyItemToClipboard(target);
          setCopiedId(target.id);
          setTimeout(() => {
            setIsQuickPasteOpen(false);
            setCopiedId(null);
          }, 400);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQuickPasteOpen, filteredItems, selectedIndex]);

  if (!isQuickPasteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150"
      onClick={() => setIsQuickPasteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#111113] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 bg-[#111113] border-b border-zinc-800 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search & Instant Re-Copy (Use Arrow keys + Enter)..."
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
          />
          <button
            onClick={() => setIsQuickPasteOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Items Feed */}
        <div className="p-2 max-h-96 overflow-y-auto space-y-1 bg-[#0a0a0b]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No matching clipboard items.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isJustCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    copyItemToClipboard(item);
                    setCopiedId(item.id);
                    setTimeout(() => {
                      setIsQuickPasteOpen(false);
                      setCopiedId(null);
                    }, 400);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                      : "bg-[#111113] text-zinc-200 border-zinc-800 hover:bg-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate max-w-md">
                    <span
                      className={`text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? "bg-indigo-700 text-indigo-100" : "bg-zinc-800 text-indigo-300"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="truncate font-sans font-medium">
                      {item.metadata.aiTitle || item.content}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    {isJustCopied ? (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                        Copied!
                      </span>
                    ) : (
                      <kbd
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isSelected
                            ? "bg-indigo-700 text-indigo-100 border-indigo-400"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {isSelected ? "Press Enter" : `Item #${index + 1}`}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Instructions */}
        <div className="p-2.5 bg-[#0a0a0b] border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" /> Navigate
            </span>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" /> Enter to Copy
            </span>
          </div>
          <span className="text-indigo-400 font-semibold">Instant Restore &lt;5s</span>
        </div>
      </div>
    </div>
  );
};
