import React, { useState } from "react";
import { Sparkles, X, Plus, Terminal, Code2, Palette, Globe, Lock, ShieldAlert, Upload, Image as ImageIcon } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";

export const QuickSimulatorBar: React.FC = () => {
  const { isSimulatorOpen, setIsSimulatorOpen, addClipboardItem } = useClipboardStore();
  const [customText, setCustomText] = useState("");
  const [appName, setAppName] = useState("VS Code");

  if (!isSimulatorOpen) return null;

  const handleInjectPreset = async (content: string, sourceApp: string) => {
    await addClipboardItem(content, sourceApp);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customText.trim()) {
      await addClipboardItem(customText.trim(), appName || "Simulator");
      setCustomText("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          addClipboardItem(base64, "Photos", "image");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const presetSamples = [
    {
      label: "JSON Payload",
      icon: <Code2 className="w-3.5 h-3.5 text-amber-400" />,
      app: "Postman",
      content: `{\n  "event": "user_signup",\n  "user": { "id": 9041, "email": "dev@pastetimeline.io" },\n  "tier": "pro"\n}`,
    },
    {
      label: "TypeScript Code",
      icon: <Code2 className="w-3.5 h-3.5 text-cyan-400" />,
      app: "VS Code",
      content: `async function fetchClipboardHistory(limit = 100): Promise<ClipboardItem[]> {\n  const items = await db.items.orderBy('created_at').reverse().limit(limit).toArray();\n  return items;\n}`,
    },
    {
      label: "SQL Statement",
      icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
      app: "DBeaver",
      content: `SELECT id, content, type FROM clipboard_items WHERE favorite = true ORDER BY created_at DESC;`,
    },
    {
      label: "Hex Color Swatch",
      icon: <Palette className="w-3.5 h-3.5 text-pink-400" />,
      app: "Figma",
      content: `#10B981`,
    },
    {
      label: "Web Bookmark URL",
      icon: <Globe className="w-3.5 h-3.5 text-blue-400" />,
      app: "Google Chrome",
      content: `https://github.com/paste-timeline/app`,
    },
    {
      label: "OTP Code (Protected)",
      icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
      app: "Messages",
      content: `Your PasteTimeline security login verification code is: 849201`,
    },
    {
      label: "Password (Protected)",
      icon: <Lock className="w-3.5 h-3.5 text-rose-400" />,
      app: "1Password",
      content: `K9#mQ$8x!pL2@vW`,
    },
  ];

  return (
    <div className="bg-amber-50/80 dark:bg-[#111113] border-b border-amber-200 dark:border-zinc-800 p-3 shadow-lg relative animate-in slide-in-from-top duration-200 transition-colors duration-150">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Clipboard Injector & Test Runner</span>
          <span className="text-[10px] text-amber-900/70 dark:text-amber-200/70 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Simulate incoming clips for testing
          </span>
        </div>
        <button
          onClick={() => setIsSimulatorOpen(false)}
          className="p-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-amber-100 dark:hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Presets List */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-1">
          {presetSamples.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleInjectPreset(preset.content, preset.app)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 whitespace-nowrap transition-all hover:border-indigo-500/40 shadow-sm"
            >
              {preset.icon}
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type custom test clip..."
            className="w-48 px-3 py-1.5 bg-white dark:bg-[#0a0a0b] border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="App Name"
            className="w-24 px-2 py-1.5 bg-white dark:bg-[#0a0a0b] border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inject</span>
          </button>

          {/* Image Upload Injector */}
          <label className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-200 dark:hover:bg-purple-600/30 border border-purple-300 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-md cursor-pointer transition-all">
            <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </form>
      </div>
    </div>
  );
};
