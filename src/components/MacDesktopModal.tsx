import React, { useState, useEffect } from "react";
import {
  Apple,
  Download,
  Laptop,
  Check,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  Terminal,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface MacDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MacDesktopModal: React.FC<MacDesktopModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<"pwa" | "electron" | "tauri">("pwa");

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        "To install PasteTimeline on macOS:\n\n" +
          "1. In Chrome / Edge: Click the 'Install' icon (+) on the right side of the address bar, or Menu -> 'Install PasteTimeline'.\n" +
          "2. In Safari (macOS Sonoma+): Click File -> 'Add to Dock'.\n\n" +
          "This places PasteTimeline directly into your macOS Applications folder and Dock!"
      );
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const macBuildScript = `# 1. Clone or download project files
git clone https://github.com/your-repo/pastetimeline.git
cd pastetimeline

# 2. Install dependencies & Electron builder
npm install
npm install --save-dev electron electron-builder

# 3. Build native macOS .app / .dmg package (Apple Silicon & Intel)
npx electron-builder --mac dmg --universal`;

  const packageJsonAddon = `{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \\"npm run dev\\" \\"wait-on http://localhost:3000 && electron .\\"",
    "build:mac": "vite build && electron-builder --mac dmg"
  },
  "build": {
    "appId": "com.pastetimeline.app",
    "productName": "PasteTimeline",
    "mac": {
      "category": "public.app-category.utilities",
      "target": ["dmg", "zip"],
      "icon": "public/icon.png"
    }
  }
}`;

  const downloadSourceZip = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            appName: "PasteTimeline macOS",
            version: "1.2.0",
            instructions: "Run 'npm install' then 'npx electron-builder --mac' on your Mac.",
            electronMain: "electron/main.js",
            electronPreload: "electron/preload.js",
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "PasteTimeline-macOS-PackageConfig.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#111113]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-md">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  macOS Desktop App Hub
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded">
                  macOS Native Ready
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Run PasteTimeline as a standalone native app on Apple Silicon (M1/M2/M3/M4) or Intel Mac
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 bg-zinc-100 dark:bg-[#0a0a0b] border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("pwa")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg border-t border-x transition-all ${
              activeTab === "pwa"
                ? "bg-white dark:bg-[#111113] border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>1-Click Mac App Install (PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab("electron")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg border-t border-x transition-all ${
              activeTab === "electron"
                ? "bg-white dark:bg-[#111113] border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Electron macOS DMG Package</span>
          </button>

          <button
            onClick={() => setActiveTab("tauri")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg border-t border-x transition-all ${
              activeTab === "tauri"
                ? "bg-white dark:bg-[#111113] border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Build Instructions</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50 dark:bg-[#0a0a0b]">
          {activeTab === "pwa" && (
            <div className="space-y-4">
              {/* Highlight Card */}
              <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Instant Desktop App for macOS
                    </h3>
                  </div>
                  {isInstalled && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" /> Installed on macOS
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  You can install PasteTimeline directly into your macOS Applications folder and Dock without installing external developer build tools. It launches in its own dedicated window with dark title bar, keyboard shortcuts, and persistent storage!
                </p>

                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    onClick={handleInstallPWA}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install PasteTimeline onto macOS Dock</span>
                  </button>

                  <button
                    onClick={downloadSourceZip}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm"
                  >
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Download App Package Config</span>
                  </button>
                </div>
              </div>

              {/* Instructions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px]">1</span>
                    Safari on macOS (Sonoma & Sequoia)
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    1. Open Safari on your Mac.<br />
                    2. Click <strong>File → Add to Dock</strong> in the macOS menu bar.<br />
                    3. Name it <em>PasteTimeline</em> and click Add!
                  </p>
                </div>

                <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px]">2</span>
                    Google Chrome / Brave / Arc on Mac
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    1. Click the <strong>Install (+) icon</strong> at the right end of the browser address bar.<br />
                    2. Or open Menu <strong>(⋮) → Cast, save and share → Install PasteTimeline</strong>.<br />
                    3. Launches instantly as a native Mac app window!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "electron" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200 tracking-wider flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Pre-Packaged Electron main process included
                  </h3>
                  <button
                    onClick={() => copyToClipboard(packageJsonAddon, "json")}
                    className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-500/30"
                  >
                    {copiedCmd === "json" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd === "json" ? "Copied" : "Copy Config"}</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  This repository includes <code>electron/main.js</code> with macOS native system tray icon, <code>Cmd+Shift+V</code> global shortcut listener, and background clipboard poller.
                </p>
                <pre className="bg-zinc-100 dark:bg-[#0a0a0b] p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto max-h-48">
                  <code>{packageJsonAddon}</code>
                </pre>
              </div>

              <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Native macOS Integration Features Built-In
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>macOS Menu Bar System Tray Icon</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Global Hotkey: Cmd+Shift+V</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Apple Silicon (M1/M2/M3/M4) + Intel DMG</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Vibrancy Blur Titlebar Effects</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "tauri" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200 tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    macOS Binary Terminal Compilation Commands
                  </h3>
                  <button
                    onClick={() => copyToClipboard(macBuildScript, "cmd")}
                    className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-500/30"
                  >
                    {copiedCmd === "cmd" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd === "cmd" ? "Copied Commands" : "Copy Terminal Commands"}</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Execute these commands in your Mac terminal after downloading/exporting the app source code from AI Studio:
                </p>
                <pre className="bg-zinc-100 dark:bg-[#0a0a0b] p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                  <code>{macBuildScript}</code>
                </pre>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 p-4 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <Sparkles className="w-4 h-4" /> Exporting from AI Studio Settings:
                </span>
                <p className="text-amber-800/80 dark:text-amber-200/80">
                  You can also click the <strong>AI Studio Top Right Menu → Export Code / Download ZIP</strong> to get the full source code project onto your Mac computer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#111113]">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Apple className="w-4 h-4 text-zinc-400" />
            <span>Target OS: macOS 11.0 Big Sur or later (Apple Silicon & Intel)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
