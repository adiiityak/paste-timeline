import React, { useEffect } from "react";
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
import { UpdateNotifier } from "./components/UpdateNotifier";
import { Toast } from "./components/Toast";

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
  } = useClipboardStore();

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

  // Live Clipboard Polling & Window Paste Event Listener
  useEffect(() => {
    // 1. Paste Event Listener
    const handlePaste = (e: ClipboardEvent) => {
      if (!isMonitoring) return;

      // Handle plain text paste
      const pastedText = e.clipboardData?.getData("text");
      if (pastedText && pastedText.trim()) {
        addClipboardItem(pastedText, "Browser Paste");
        return;
      }

      // Handle image paste
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target?.result as string;
                if (base64) {
                  addClipboardItem(base64, "Image Paste", "image");
                }
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    // 2. Clipboard Polling Interval when document focused
    let intervalId: any = null;
    if (isMonitoring && settings.pollIntervalMs > 0) {
      intervalId = setInterval(async () => {
        if (document.hasFocus() && navigator.clipboard && navigator.clipboard.readText) {
          try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
              addClipboardItem(text, "System Clipboard");
            }
          } catch {
            // Permission denied or window lost focus
          }
        }
      }, settings.pollIntervalMs);
    }

    return () => {
      window.removeEventListener("paste", handlePaste);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMonitoring, settings.pollIntervalMs, addClipboardItem]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-50 text-zinc-900 dark:bg-[#0a0a0b] dark:text-zinc-100 font-sans overflow-hidden select-none transition-colors duration-150">
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
          <span>Shortcuts: {settings.hotkey}</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">PasteTimeline v1.2</span>
        </div>
      </footer>

      {/* Inspector Detail Modal */}
      {selectedItem && (
        <ClipDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Floating Quick Paste Overlay */}
      <QuickPasteOverlay />

      {/* macOS Desktop Installation & Packaging Modal */}
      <MacDesktopModal isOpen={isMacModalOpen} onClose={() => setIsMacModalOpen(false)} />

      {/* Notification Toast */}
      <Toast />

      {/* Software Update Toast Banner */}
      <UpdateNotifier />
    </div>
  );
}
