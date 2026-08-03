import { ClipboardItem, Collection, AppSettings } from "../types/clipboard";

const DB_NAME = "PasteTimelineDB";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Items Store
      if (!db.objectStoreNames.contains("items")) {
        const itemStore = db.createObjectStore("items", { keyPath: "id" });
        itemStore.createIndex("created_at", "created_at", { unique: false });
        itemStore.createIndex("type", "type", { unique: false });
        itemStore.createIndex("favorite", "favorite", { unique: false });
        itemStore.createIndex("pinned", "pinned", { unique: false });
        itemStore.createIndex("collection", "collection", { unique: false });
      }

      // 2. Collections Store
      if (!db.objectStoreNames.contains("collections")) {
        db.createObjectStore("collections", { keyPath: "id" });
      }

      // 3. Settings Store
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Default initial settings
export const DEFAULT_SETTINGS: AppSettings = {
  historyLimit: 200,
  autoDeleteDays: 7, // 7 days automatic data retention policy
  privacyMode: false,
  maskSensitiveData: true,
  excludedApps: ["1Password", "Bitwarden", "KeePass", "Incognito"],
  hotkey: "Ctrl+Shift+V",
  launchOnStartup: true,
  theme: "dark",
  syncEnabled: false,
  pollIntervalMs: 800,
  soundEffects: true,
};

// Default initial collections
export const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "col_work", name: "Work & Docs", color: "indigo", description: "Work snippets, notes & documentation", created_at: Date.now() - 100000 },
  { id: "col_code", name: "Code Snippets", color: "emerald", description: "Useful algorithms, functions & components", created_at: Date.now() - 80000 },
  { id: "col_design", name: "Colors & Design", color: "amber", description: "Color swatches, hex codes & CSS styles", created_at: Date.now() - 60000 },
];

export async function saveClipboardItem(item: ClipboardItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllClipboardItems(): Promise<ClipboardItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readonly");
    const store = tx.objectStore("items");
    const request = store.getAll();
    request.onsuccess = () => {
      const items: ClipboardItem[] = request.result || [];
      // Sort pinned first, then by created_at descending
      items.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.created_at - a.created_at;
      });
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteClipboardItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    tx.objectStore("items").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function bulkDeleteClipboardItems(ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    for (const id of ids) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function bulkAssignCollection(ids: string[], collectionId: string | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    let count = 0;
    ids.forEach((id) => {
      const req = store.get(id);
      req.onsuccess = () => {
        const item: ClipboardItem = req.result;
        if (item) {
          item.collection = collectionId;
          store.put(item);
        }
        count++;
        if (count === ids.length) resolve();
      };
    });
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllClipboardItems(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    tx.objectStore("items").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function toggleItemFavorite(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    const req = store.get(id);
    req.onsuccess = () => {
      const item: ClipboardItem = req.result;
      if (item) {
        item.favorite = !item.favorite;
        store.put(item);
        resolve(item.favorite);
      } else {
        resolve(false);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function toggleItemPin(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    const req = store.get(id);
    req.onsuccess = () => {
      const item: ClipboardItem = req.result;
      if (item) {
        item.pinned = !item.pinned;
        store.put(item);
        resolve(item.pinned);
      } else {
        resolve(false);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function incrementItemCopyCount(id: string): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    const req = store.get(id);
    req.onsuccess = () => {
      const item: ClipboardItem = req.result;
      if (item) {
        item.copy_count = (item.copy_count || 0) + 1;
        store.put(item);
        resolve(item.copy_count);
      } else {
        resolve(1);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Collections CRUD
export async function getStoredCollections(): Promise<Collection[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("collections", "readonly");
    const req = tx.objectStore("collections").getAll();
    req.onsuccess = () => {
      let collections: Collection[] = req.result || [];
      if (collections.length === 0) {
        // Seed default collections
        seedCollections(DEFAULT_COLLECTIONS);
        collections = DEFAULT_COLLECTIONS;
      }
      resolve(collections);
    };
    req.onerror = () => reject(req.error);
  });
}

async function seedCollections(cols: Collection[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("collections", "readwrite");
  const store = tx.objectStore("collections");
  cols.forEach((c) => store.put(c));
}

export async function saveStoredCollection(col: Collection): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("collections", "readwrite");
    tx.objectStore("collections").put(col);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteStoredCollection(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("collections", "readwrite");
    tx.objectStore("collections").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Settings DB
export async function getStoredSettings(): Promise<AppSettings> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const req = tx.objectStore("settings").get("config");
    req.onsuccess = () => {
      if (req.result && req.result.val) {
        resolve({ ...DEFAULT_SETTINGS, ...req.result.val });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveStoredSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put({ key: "config", val: settings });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function purgeExpiredItems(autoDeleteDays: number): Promise<string[]> {
  if (autoDeleteDays <= 0) return [];
  const db = await openDB();
  const cutoff = Date.now() - autoDeleteDays * 24 * 60 * 60 * 1000;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    const req = store.getAll();
    const deletedIds: string[] = [];

    req.onsuccess = () => {
      const items: ClipboardItem[] = req.result || [];
      for (const item of items) {
        // Unpinned and unstarred items older than autoDeleteDays are purged automatically
        if (!item.pinned && !item.favorite && item.created_at < cutoff) {
          store.delete(item.id);
          deletedIds.push(item.id);
        }
      }
    };
    tx.oncomplete = () => resolve(deletedIds);
    tx.onerror = () => reject(tx.error);
  });
}
