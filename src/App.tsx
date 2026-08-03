import React, { useEffect, useState } from "react";
import { useClipboardStore } from "./stores/clipboardStore";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { QuickSimulatorBar } from "./components/QuickSimulatorBar";
import { TimelineView } from "./components/TimelineView";
import { SearchView } from "./components/SearchView";
import { FavoritesView } from "./components/FavoritesView";
import { CollectionsView } from "./components/CollectionsView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SettingsView } from "./components/SettingsView";
import { PrivacyView } from "./components/PrivacyView";
import { ClipDetailModal } from "./components/ClipDetailModal";
import { QuickPasteOverlay } from "./components/QuickPasteOverlay";
import { MacDesktopModal } from "./components/MacDesktopModal";
import { ScreenSnipperModal } from "./components/ScreenSnipperModal";
import { UpdateNotifier } from "./components/UpdateNotifier";
import { Toast } from "./components/Toast";
import { Upload } from "lucide-react";

export default function App() {
  const {
    activeTab,
    loadInitialData,
    addClipboardItem,
    isMonitoring,
    settings,
    selectedItem,
    setSelectedItem,
    items,
    isMacModalOpen,
    setIsMacModalOpen,
    isSnipperOpen,
    setIsSnipperOpen,
    showToast,
  } = useClipboardStore();

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Sync theme class on <html> element whenever settings.theme changes
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  // Load IndexedDB data on boot
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Native Electron Desktop IPC Listeners
  useEffect(() => {
    const win = window as any;
    if (win.macNativeAPI) {
      if (win.macNativeAPI.onNativeClip) {
        win.macNativeAPI.onNativeClip((data: { content: string; app: string; type?: any }) => {
          if (data && data.content) {
            addClipboardItem(data.content, data.app || "macOS Clipboard", data.type);
          }
        });
      }
      if (win.macNativeAPI.onTriggerScreenSnipper) {
        win.macNativeAPI.onTriggerScreenSnipper(() => {
          setIsSnipperOpen(true);
        });
      }
    }
  }, [addClipboardItem, setIsSnipperOpen]);

  // Keyboard shortcut listener for Cmd+Shift+S / Ctrl+Shift+S (Screen Snipper)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setIsSnipperOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSnipperOpen]);

  // Drag & Drop Image Files Listener
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX === 0 || e.clientY === 0) {
        setIsDraggingFile(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);

      if (!isMonitoring) return;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                addClipboardItem(base64, file.name || "Dropped Image", "image");
                showToast(`Captured dropped image: ${file.name}`);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [isMonitoring, addClipboardItem, showToast]);

  // Live Clipboard Polling & Window Paste Event Listener
  useEffect(() => {
    // 1. Comprehensive Paste Event Listener (Image files & Text)
    const handlePaste = (e: ClipboardEvent) => {
      if (!isMonitoring) return;

      let hasHandledImage = false;

      // Check for image files in clipboard first (e.g. copied from local folder, screenshot, or browser)
      const items = e.clipboardData?.items;
      const files = e.clipboardData?.files;

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith("image/")) {
            hasHandledImage = true;
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                addClipboardItem(base64, file.name || "Image Paste", "image");
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }

      if (!hasHandledImage && items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const blob = items[i].getAsFile();
            if (blob) {
              hasHandledImage = true;
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target?.result as string;
                if (base64) {
                  addClipboardItem(base64, "Screenshot / Image Clipboard", "image");
                }
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      }

      // Fallback: Handle plain text paste if no image file was found
      if (!hasHandledImage) {
        const pastedText = e.clipboardData?.getData("text");
        if (pastedText && pastedText.trim()) {
          addClipboardItem(pastedText, "Browser Paste");
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    // 2. Comprehensive Clipboard Checker for Text & OS Screenshots
    const checkClipboardForItems = async () => {
      if (!isMonitoring || !document.hasFocus()) return;

      let imageHandled = false;

      // 1. Try reading binary images / OS screenshots from clipboard
      if (navigator.clipboard && navigator.clipboard.read) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            for (const type of item.types) {
              if (type.startsWith("image/")) {
                imageHandled = true;
                const blob = await item.getType(type);
                const reader = new FileReader();
                reader.onload = (event) => {
                  const base64 = event.target?.result as string;
                  if (base64) {
                    addClipboardItem(base64, "System Screenshot / Image Clipboard", "image");
                  }
                };
                reader.readAsDataURL(blob);
                break;
              }
            }
            if (imageHandled) break;
          }
        } catch {
          // Permission denied for raw clipboard binary read - expected in unprompted polling
        }
      }

      // 2. Check text clipboard if no binary image was processed
      if (!imageHandled && navigator.clipboard && navigator.clipboard.readText) {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) {
            addClipboardItem(text, "System Clipboard");
          }
        } catch {
          // Permission denied or window lost focus
        }
      }
    };

    // Auto-check on window focus (user returning after taking a screenshot)
    window.addEventListener("focus", checkClipboardForItems);

    let intervalId: any = null;
    if (isMonitoring && settings.pollIntervalMs > 0) {
      intervalId = setInterval(checkClipboardForItems, settings.pollIntervalMs);
    }

    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("focus", checkClipboardForItems);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMonitoring, settings.pollIntervalMs, addClipboardItem]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-50 text-zinc-900 dark:bg-[#0a0a0b] dark:text-zinc-100 font-sans overflow-hidden select-none transition-colors duration-150 relative">
      {/* Drag & Drop Overlay Indicator */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-indigo-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-150 pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-4 shadow-2xl border border-white/30 animate-bounce">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Drop Image Here to Save</h2>
          <p className="text-sm text-indigo-100 mt-1">
            Image files copied or dragged from folders will be instantly captured in PasteTimeline
          </p>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar />

      {/* Test Injector Bar */}
      <QuickSimulatorBar />

      {/* Main Full-Height Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Active Tab Screen */}
        <main className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-[#0a0a0b] overflow-hidden relative">
          {activeTab === "timeline" && <TimelineView />}
          {activeTab === "search" && <SearchView />}
          {activeTab === "favorites" && <FavoritesView />}
          {activeTab === "collections" && <CollectionsView />}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "settings" && <SettingsView />}
          {activeTab === "privacy" && <PrivacyView />}
        </main>
      </div>

      {/* Bottom Status Strip */}
      <footer className="h-7 bg-zinc-200/80 border-t border-zinc-300 dark:bg-[#111113] dark:border-zinc-800/80 flex items-center px-4 justify-between text-[10px] font-mono text-zinc-600 dark:text-zinc-400 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            Status: {isMonitoring ? "Monitoring Active" : "Paused"}
          </span>
          <span>Polling Rate: {settings.pollIntervalMs}ms</span>
          <span>Items: {items.length}</span>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <span>Shortcuts: {settings.hotkey} | Snip: Cmd+Shift+S</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">PasteTimeline v1.2</span>
        </div>
      </footer>

      {/* Inspector Detail Modal */}
      {selectedItem && (
        <ClipDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Floating Quick Paste Overlay */}
      <QuickPasteOverlay />

      {/* Screen Snipper & Image Capture Modal */}
      <ScreenSnipperModal isOpen={isSnipperOpen} onClose={() => setIsSnipperOpen(false)} />

      {/* macOS Desktop Installation & Packaging Modal */}
      <MacDesktopModal isOpen={isMacModalOpen} onClose={() => setIsMacModalOpen(false)} />

      {/* Notification Toast */}
      <Toast />

      {/* Software Update Toast Banner */}
      <UpdateNotifier />
    </div>
  );
}
