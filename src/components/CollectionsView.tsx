import React, { useState } from "react";
import { Folder, Plus, Trash2, FolderOpen, Layers } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";
import { ClipCard } from "./ClipCard";

export const CollectionsView: React.FC = () => {
  const {
    collections,
    createCollection,
    deleteCollection,
    items,
    selectedCollectionId,
    setSelectedCollectionId,
    selectedItemIds,
    toggleItemSelection,
    setActiveTab,
  } = useClipboardStore();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const colors = ["indigo", "emerald", "amber", "rose", "cyan", "purple"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      createCollection(name.trim(), color, desc.trim());
      setName("");
      setDesc("");
      setIsModalOpen(false);
    }
  };

  const activeCol = collections.find((c) => c.id === selectedCollectionId);
  const colItems = activeCol ? items.filter((i) => i.collection === activeCol.id) : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0a0a0b] overflow-y-auto p-4 space-y-4 transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111113] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Clipboard Collections</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Organize copied items into custom folders & projects</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {collections.map((col) => {
          const count = items.filter((i) => i.collection === col.id).length;
          const isSelected = selectedCollectionId === col.id;

          return (
            <div
              key={col.id}
              onClick={() => setSelectedCollectionId(isSelected ? null : col.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? "bg-white dark:bg-[#111113] border-indigo-500 ring-1 ring-indigo-500 shadow-md"
                  : "bg-white dark:bg-[#111113] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{col.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {count} items
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(col.id);
                    }}
                    className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {col.description && <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{col.description}</p>}
            </div>
          );
        })}
      </div>

      {/* Selected Collection Items Stream */}
      {activeCol && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-1">
            <span>Items in "{activeCol.name}" ({colItems.length})</span>
            <button
              onClick={() => {
                setSelectedCollectionId(activeCol.id);
                setActiveTab("timeline");
              }}
              className="text-xs text-indigo-600 dark:text-indigo-300 hover:underline"
            >
              View in Timeline
            </button>
          </div>

          {colItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500 bg-white dark:bg-[#111113] rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
              No items assigned to this collection yet. Select items in timeline or inspector to assign.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {colItems.map((item) => (
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
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 p-5 rounded-lg shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Create New Collection</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Alpha, Auth Snippets"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Description (Optional)</label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Short notes about this collection..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-sm"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
