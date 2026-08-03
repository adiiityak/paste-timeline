import { create } from "zustand";
import type { ClipboardItem } from "../types/clipboard";
import { Collection, AppSettings, ViewTab, ClipboardType } from "../types/clipboard";
import { detectClipboardType } from "../utils/typeDetector";
import { checkSensitivity } from "../utils/privacyFilter";
import {
  getAllClipboardItems,
  saveClipboardItem,
  deleteClipboardItem,
  bulkDeleteClipboardItems,
  bulkAssignCollection,
  clearAllClipboardItems,
  toggleItemFavorite,
  toggleItemPin,
  incrementItemCopyCount,
  getStoredCollections,
  saveStoredCollection,
  deleteStoredCollection,
  getStoredSettings,
  saveStoredSettings,
  purgeExpiredItems,
  DEFAULT_SETTINGS,
} from "../db/indexedDb";

interface ClipboardState {
  items: ClipboardItem[];
  collections: Collection[];
  settings: AppSettings;
  activeTab: ViewTab;
  searchQuery: string;
  typeFilter: string; // 'all' or ClipboardType
  selectedCollectionId: string | null;
  selectedTag: string | null;
  dateFilter: "all" | "today" | "yesterday" | "week";
  selectedItem: ClipboardItem | null;
  selectedItemIds: string[];
  isSimulatorOpen: boolean;
  isQuickPasteOpen: boolean;
  isMacModalOpen: boolean;
  isSnipperOpen: boolean;
  toastMessage: string | null;
  isMonitoring: boolean;
  lastCopiedText: string;

  // Actions
  loadInitialData: () => Promise<void>;
  addClipboardItem: (content: string, appName?: string, overrideType?: ClipboardType) => Promise<ClipboardItem | null>;
  deleteItem: (id: string) => Promise<void>;
  bulkDeleteSelected: () => Promise<void>;
  bulkAssignSelectedCollection: (colId: string | null) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  updateItemTags: (id: string, tags: string[]) => Promise<void>;
  updateItemCollection: (id: string, collectionId: string | null) => Promise<void>;
  updateItemOcrText: (id: string, ocrText: string) => Promise<void>;
  updateItemContent: (id: string, newContent: string, newType?: ClipboardType) => Promise<void>;
  updateItemAiAnalysis: (id: string, aiData: { summary?: string; autoTitle?: string; actionItems?: string[]; suggestedTags?: string[] }) => Promise<void>;
  copyItemToClipboard: (item: ClipboardItem) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  createCollection: (name: string, color: string, description?: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  showToast: (msg: string) => void;
  toggleMonitoring: () => void;
  setActiveTab: (tab: ViewTab) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: string) => void;
  setDateFilter: (date: "all" | "today" | "yesterday" | "week") => void;
  setSelectedCollectionId: (colId: string | null) => void;
  setSelectedTag: (tag: string | null) => void;
  setSelectedItem: (item: ClipboardItem | null) => void;
  toggleItemSelection: (id: string) => void;
  selectAllVisibleItems: (ids: string[]) => void;
  clearSelection: () => void;
  setIsSimulatorOpen: (open: boolean) => void;
  setIsQuickPasteOpen: (open: boolean) => void;
  setIsMacModalOpen: (open: boolean) => void;
  setIsSnipperOpen: (open: boolean) => void;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  collections: [],
  settings: DEFAULT_SETTINGS,
  activeTab: "timeline",
  searchQuery: "",
  typeFilter: "all",
  selectedCollectionId: null,
  selectedTag: null,
  dateFilter: "all",
  selectedItem: null,
  selectedItemIds: [],
  isSimulatorOpen: false,
  isQuickPasteOpen: false,
  isMacModalOpen: false,
  isSnipperOpen: false,
  toastMessage: null,
  isMonitoring: true,
  lastCopiedText: "",

  loadInitialData: async () => {
    try {
      const [rawItems, collections, settings] = await Promise.all([
        getAllClipboardItems(),
        getStoredCollections(),
        getStoredSettings(),
      ]);

      // Seed initial sample items if empty AND history hasn't been intentionally cleared
      let finalItems = rawItems;
      const hasBeenCleared = localStorage.getItem("paste_timeline_cleared_history") === "true";
      if (rawItems.length === 0 && !hasBeenCleared) {
        finalItems = await seedSampleData();
      }

      // Enforce auto-delete retention policy (e.g., 7 days default)
      if (settings.autoDeleteDays > 0) {
        const deletedIds = await purgeExpiredItems(settings.autoDeleteDays);
        if (deletedIds.length > 0) {
          finalItems = finalItems.filter((item) => !deletedIds.includes(item.id));
        }
      }

      set({ items: finalItems, collections, settings });
    } catch (err) {
      console.error("Failed to load initial clipboard data:", err);
    }
  },

  addClipboardItem: async (content: string, appName: string = "Clipboard", overrideType?: ClipboardType) => {
    const { items, settings, isMonitoring, lastCopiedText, showToast } = get();

    if (!isMonitoring && !overrideType) return null;
    const trimmed = content.trim();
    if (!trimmed) return null;

    // Ignore consecutive duplicate copy
    if (trimmed === lastCopiedText) return null;

    // Privacy & Excluded app checks
    if (settings.excludedApps.some((app) => appName.toLowerCase().includes(app.toLowerCase()))) {
      showToast(`Ignored copy from excluded application: ${appName}`);
      return null;
    }

    const detection = detectClipboardType(content);
    const type = overrideType || detection.type;

    // Check sensitive data (Passwords, OTPs, Credit Cards, API Keys)
    const sensitivity = checkSensitivity(content, settings.maskSensitiveData);

    const newItem: ClipboardItem = {
      id: "clip_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      content,
      type,
      created_at: Date.now(),
      favorite: false,
      pinned: false,
      collection: null,
      tags: [type],
      app_name: appName,
      metadata: {
        ...detection.metadata,
        isSensitive: sensitivity.isSensitive,
        sensitiveType: sensitivity.sensitiveType,
        maskedContent: sensitivity.maskedContent,
      },
      copy_count: 1,
    };

    // Auto-delete enforcement if age limit or history capacity exceeded
    let updatedItems = [newItem, ...items];

    if (settings.autoDeleteDays > 0) {
      const cutoff = Date.now() - settings.autoDeleteDays * 24 * 60 * 60 * 1000;
      const expired = updatedItems.filter((i) => !i.pinned && !i.favorite && i.created_at < cutoff);
      if (expired.length > 0) {
        const expiredIds = expired.map((e) => e.id);
        await bulkDeleteClipboardItems(expiredIds);
        updatedItems = updatedItems.filter((i) => !expiredIds.includes(i.id));
      }
    }

    if (settings.historyLimit > 0 && updatedItems.length > settings.historyLimit) {
      updatedItems = updatedItems.slice(0, settings.historyLimit);
    }

    await saveClipboardItem(newItem);

    set({
      items: updatedItems,
      lastCopiedText: trimmed,
    });

    if (settings.soundEffects) {
      playCopyAudioFeedback();
    }

    showToast(`Copied to PasteTimeline (${type.toUpperCase()})`);
    return newItem;
  },

  deleteItem: async (id: string) => {
    await deleteClipboardItem(id);
    const { items, selectedItem, selectedItemIds } = get();
    set({
      items: items.filter((item) => item.id !== id),
      selectedItem: selectedItem?.id === id ? null : selectedItem,
      selectedItemIds: selectedItemIds.filter((itemId) => itemId !== id),
    });
  },

  bulkDeleteSelected: async () => {
    const { selectedItemIds } = get();
    if (selectedItemIds.length === 0) return;

    await bulkDeleteClipboardItems(selectedItemIds);
    const { items } = get();
    set({
      items: items.filter((item) => !selectedItemIds.includes(item.id)),
      selectedItemIds: [],
    });
    get().showToast(`Deleted ${selectedItemIds.length} items`);
  },

  bulkAssignSelectedCollection: async (colId: string | null) => {
    const { selectedItemIds, items } = get();
    if (selectedItemIds.length === 0) return;

    await bulkAssignCollection(selectedItemIds, colId);
    const updatedItems = items.map((item) =>
      selectedItemIds.includes(item.id) ? { ...item, collection: colId } : item
    );

    set({ items: updatedItems, selectedItemIds: [] });
    get().showToast(`Updated collection for ${selectedItemIds.length} items`);
  },

  toggleFavorite: async (id: string) => {
    const newFav = await toggleItemFavorite(id);
    const { items } = get();
    set({
      items: items.map((item) => (item.id === id ? { ...item, favorite: newFav } : item)),
    });
  },

  togglePin: async (id: string) => {
    const newPin = await toggleItemPin(id);
    const { items } = get();
    const updated = items.map((item) => (item.id === id ? { ...item, pinned: newPin } : item));

    // Sort pinned items to the top
    updated.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.created_at - a.created_at;
    });

    set({ items: updated });
  },

  updateItemTags: async (id: string, tags: string[]) => {
    const { items } = get();
    const updated = items.map((item) => (item.id === id ? { ...item, tags } : item));
    const target = updated.find((i) => i.id === id);
    if (target) await saveClipboardItem(target);
    set({ items: updated });
  },

  updateItemCollection: async (id: string, collectionId: string | null) => {
    const { items } = get();
    const updated = items.map((item) => (item.id === id ? { ...item, collection: collectionId } : item));
    const target = updated.find((i) => i.id === id);
    if (target) await saveClipboardItem(target);
    set({ items: updated });
  },

  updateItemOcrText: async (id: string, ocrText: string) => {
    const { items } = get();
    const updated = items.map((item) => (item.id === id ? { ...item, ocr_text: ocrText } : item));
    const target = updated.find((i) => i.id === id);
    if (target) await saveClipboardItem(target);
    set({ items: updated });
  },

  updateItemContent: async (id: string, newContent: string, newType?: ClipboardType) => {
    const { items, showToast } = get();
    const updated = items.map((item) => {
      if (item.id === id) {
        const type = newType || (newContent.startsWith("data:image/") ? "image" : item.type);
        return {
          ...item,
          content: newContent,
          type,
          tags: Array.from(new Set([...item.tags, type])),
        };
      }
      return item;
    });
    const target = updated.find((i) => i.id === id);
    if (target) await saveClipboardItem(target);
    set({ items: updated });
    showToast("Clip updated with image data!");
  },

  updateItemAiAnalysis: async (id, aiData) => {
    const { items } = get();
    const updated = items.map((item) => {
      if (item.id === id) {
        const newTags = Array.from(new Set([...item.tags, ...(aiData.suggestedTags || [])]));
        return {
          ...item,
          tags: newTags,
          metadata: {
            ...item.metadata,
            aiSummary: aiData.summary || item.metadata.aiSummary,
            aiTitle: aiData.autoTitle || item.metadata.aiTitle,
            aiActionItems: aiData.actionItems || item.metadata.aiActionItems,
          },
        };
      }
      return item;
    });

    const target = updated.find((i) => i.id === id);
    if (target) await saveClipboardItem(target);
    set({ items: updated });
  },

  copyItemToClipboard: async (item: ClipboardItem) => {
    try {
      let copiedAsImage = false;

      // If item is an image data URL, write the actual binary image blob to system clipboard
      if (item.type === "image" && item.content.startsWith("data:image/")) {
        try {
          const res = await fetch(item.content);
          const blob = await res.blob();
          const mimeType = blob.type.startsWith("image/") ? blob.type : "image/png";

          if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
            await navigator.clipboard.write([
              new ClipboardItem({
                [mimeType]: blob,
              }),
            ]);
            copiedAsImage = true;
          }
        } catch (imgWriteErr) {
          console.warn("Clipboard binary image write failed, falling back to data URL text:", imgWriteErr);
        }
      }

      if (!copiedAsImage) {
        await navigator.clipboard.writeText(item.content);
      }

      await incrementItemCopyCount(item.id);

      const { items, showToast, settings } = get();
      const updated = items.map((i) => (i.id === item.id ? { ...i, copy_count: (i.copy_count || 0) + 1 } : i));

      set({ items: updated, lastCopiedText: item.content });

      if (settings.soundEffects) {
        playCopyAudioFeedback();
      }

      showToast(copiedAsImage ? "Copied image to clipboard!" : "Re-copied to system clipboard!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      get().showToast("Copy permission error");
    }
  },

  clearAllHistory: async () => {
    try {
      localStorage.setItem("paste_timeline_cleared_history", "true");
      await clearAllClipboardItems();
      set({ items: [], selectedItem: null, selectedItemIds: [] });
      get().showToast("Clipboard history cleared successfully!");
    } catch (err) {
      console.error("Failed to clear clipboard history:", err);
      get().showToast("Failed to clear history");
    }
  },

  createCollection: async (name: string, color: string, description?: string) => {
    const newCol: Collection = {
      id: "col_" + Date.now(),
      name,
      color,
      description,
      created_at: Date.now(),
    };
    await saveStoredCollection(newCol);
    const collections = await getStoredCollections();
    set({ collections });
    get().showToast(`Collection "${name}" created`);
  },

  deleteCollection: async (id: string) => {
    await deleteStoredCollection(id);
    const collections = await getStoredCollections();
    const { items } = get();
    // Unassign collection from items
    const updatedItems = items.map((item) => (item.collection === id ? { ...item, collection: null } : item));
    set({ collections, items: updatedItems });
    get().showToast("Collection removed");
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const { settings, items } = get();
    const updated = { ...settings, ...newSettings };
    await saveStoredSettings(updated);

    let finalItems = items;
    if (updated.autoDeleteDays > 0) {
      const deletedIds = await purgeExpiredItems(updated.autoDeleteDays);
      if (deletedIds.length > 0) {
        finalItems = items.filter((item) => !deletedIds.includes(item.id));
      }
    }

    set({ settings: updated, items: finalItems });
    get().showToast("Settings updated");
  },

  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 2500);
  },

  toggleMonitoring: () => {
    const { isMonitoring, showToast } = get();
    set({ isMonitoring: !isMonitoring });
    showToast(!isMonitoring ? "Clipboard recording enabled" : "Clipboard recording paused");
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setDateFilter: (dateFilter) => set({ dateFilter }),
  setSelectedCollectionId: (selectedCollectionId) => set({ selectedCollectionId }),
  setSelectedTag: (selectedTag) => set({ selectedTag }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),

  toggleItemSelection: (id) => {
    const { selectedItemIds } = get();
    set({
      selectedItemIds: selectedItemIds.includes(id)
        ? selectedItemIds.filter((itemId) => itemId !== id)
        : [...selectedItemIds, id],
    });
  },

  selectAllVisibleItems: (ids) => set({ selectedItemIds: ids }),
  clearSelection: () => set({ selectedItemIds: [] }),
  setIsSimulatorOpen: (open) => set({ isSimulatorOpen: open }),
  setIsQuickPasteOpen: (open) => set({ isQuickPasteOpen: open }),
  setIsMacModalOpen: (open) => set({ isMacModalOpen: open }),
  setIsSnipperOpen: (open) => set({ isSnipperOpen: open }),
}));

function playCopyAudioFeedback() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5 note
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // Audio Context not allowed or muted
  }
}

// Initial sample seed data for high-quality immediate preview
async function seedSampleData(): Promise<ClipboardItem[]> {
  const samples: ClipboardItem[] = [
    {
      id: "clip_sample_1",
      content: `import { create } from 'zustand';\n\nexport const useAppStore = create((set) => ({\n  theme: 'dark',\n  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),\n}));`,
      type: "code",
      created_at: Date.now() - 1000 * 60 * 5, // 5 min ago
      favorite: true,
      pinned: true,
      collection: "col_code",
      tags: ["code", "typescript", "zustand", "react"],
      app_name: "VS Code",
      metadata: {
        language: "typescript",
        lineCount: 7,
        wordCount: 28,
        charCount: 215,
        aiTitle: "Zustand Store Hook Template",
        aiSummary: "A clean state management store template utilizing Zustand in TypeScript.",
      },
      copy_count: 4,
    },
    {
      id: "clip_sample_2",
      content: `#6366F1`,
      type: "hex",
      created_at: Date.now() - 1000 * 60 * 18, // 18 min ago
      favorite: true,
      pinned: false,
      collection: "col_design",
      tags: ["hex", "color", "brand", "ui"],
      app_name: "Figma",
      metadata: {
        colorHex: "#6366F1",
        colorRgb: "rgb(99, 102, 241)",
        colorHsl: "hsl(239, 84%, 67%)",
        lineCount: 1,
        wordCount: 1,
        charCount: 7,
        aiTitle: "Indigo Brand Color Swatch",
      },
      copy_count: 2,
    },
    {
      id: "clip_sample_3",
      content: `{\n  "service": "PasteTimeline API",\n  "version": "1.0.0",\n  "status": "healthy",\n  "database": "SQLite FTS5",\n  "features": ["smart-detection", "ocr", "ai-summaries"]\n}`,
      type: "json",
      created_at: Date.now() - 1000 * 60 * 45, // 45 min ago
      favorite: false,
      pinned: false,
      collection: "col_work",
      tags: ["json", "api", "config"],
      app_name: "Postman",
      metadata: {
        language: "json",
        jsonKeyCount: 5,
        lineCount: 7,
        wordCount: 12,
        charCount: 158,
        aiTitle: "API Service Health Payload",
      },
      copy_count: 1,
    },
    {
      id: "clip_sample_4",
      content: `SELECT items.id, items.content, items.type, COUNT(items.copy_count) AS popularity\nFROM clipboard_items items\nWHERE items.favorite = 1 AND items.created_at >= strftime('%s', 'now', '-7 days')\nGROUP BY items.id\nORDER BY popularity DESC;`,
      type: "sql",
      created_at: Date.now() - 1000 * 60 * 120, // 2 hrs ago
      favorite: false,
      pinned: false,
      collection: "col_code",
      tags: ["sql", "database", "analytics"],
      app_name: "DBeaver",
      metadata: {
        language: "sql",
        lineCount: 5,
        wordCount: 28,
        charCount: 252,
        aiTitle: "Popular Clips Analytics SQL Query",
      },
      copy_count: 3,
    },
    {
      id: "clip_sample_5",
      content: `https://ai.studio/build`,
      type: "url",
      created_at: Date.now() - 1000 * 60 * 240, // 4 hrs ago
      favorite: true,
      pinned: false,
      collection: "col_work",
      tags: ["url", "web", "ai-studio"],
      app_name: "Google Chrome",
      source_url: "https://ai.studio/build",
      metadata: {
        urlDomain: "ai.studio",
        urlTitle: "Google AI Studio Build Workspace",
        lineCount: 1,
        wordCount: 1,
        charCount: 22,
      },
      copy_count: 5,
    },
    {
      id: "clip_sample_6",
      content: `TODO: Review security rules for PasteTimeline.\nAction Items:\n- Test 6-digit OTP code auto-masking.\n- Verify password manager exclusions.\n- Check SQLite FTS5 search performance on 500+ items.`,
      type: "text",
      created_at: Date.now() - 1000 * 60 * 480, // 8 hrs ago
      favorite: false,
      pinned: false,
      collection: "col_work",
      tags: ["text", "todo", "action-items"],
      app_name: "Notes",
      metadata: {
        lineCount: 5,
        wordCount: 28,
        charCount: 202,
        aiTitle: "Security & QA Action Items List",
        aiActionItems: [
          "Test 6-digit OTP code auto-masking",
          "Verify password manager exclusions",
          "Check SQLite FTS5 search performance on 500+ items",
        ],
      },
      copy_count: 1,
    },
  ];

  for (const item of samples) {
    await saveClipboardItem(item);
  }

  return samples;
}
