import React from "react";
import { CheckCircle2, Zap } from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";

export const Toast: React.FC = () => {
  const { toastMessage } = useClipboardStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-xl shadow-indigo-600/30 border border-indigo-400/30 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
      <span>{toastMessage}</span>
    </div>
  );
};
