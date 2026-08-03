import React from "react";
import { Star, Pin } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";
import { ClipCard } from "./ClipCard";

export const FavoritesView: React.FC = () => {
  const { items, selectedItemIds, toggleItemSelection } = useClipboardStore();

  const favItems = items.filter((i) => i.favorite || i.pinned);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0b] overflow-y-auto p-4 space-y-4 transition-colors duration-150">
      <div className="flex items-center justify-between bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500 dark:text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Starred & Pinned Clips</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your important clipboard items kept permanently accessible
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
          {favItems.length} Saved
        </span>
      </div>

      {favItems.length === 0 ? (
        <div className="p-16 text-center text-xs text-zinc-500 dark:text-zinc-500 bg-white dark:bg-[#111113] rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
          <p className="font-semibold text-zinc-800 dark:text-zinc-300">No starred or pinned items yet.</p>
          <p className="max-w-xs mx-auto">
            Click the star or pin icon on any card in your timeline to save it here for quick access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {favItems.map((item) => (
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
  );
};
