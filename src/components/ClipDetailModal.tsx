import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Star,
  Pin,
  Sparkles,
  ScanText,
  Tag as TagIcon,
  Folder,
  Code2,
  Calendar,
  Layers,
  ListTodo,
  Brain,
  Download,
  Share2,
} from "lucide-react";
import { ClipboardItem } from "../types/clipboard";
import { useClipboardStore } from "../stores/clipboardStore";
import { performOcrOnImage } from "../utils/ocrEngine";

interface ClipDetailModalProps {
  item: ClipboardItem;
  onClose: () => void;
}

export const ClipDetailModal: React.FC<ClipDetailModalProps> = ({ item, onClose }) => {
  const {
    copyItemToClipboard,
    toggleFavorite,
    togglePin,
    updateItemTags,
    updateItemCollection,
    updateItemOcrText,
    updateItemAiAnalysis,
    collections,
  } = useClipboardStore();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"formatted" | "raw" | "ai" | "ocr">("formatted");
  const [tagInput, setTagInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  const handleCopy = () => {
    copyItemToClipboard(item);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      if (!item.tags.includes(newTag)) {
        updateItemTags(item.id, [...item.tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateItemTags(
      item.id,
      item.tags.filter((t) => t !== tagToRemove)
    );
  };

  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: item.content, type: item.type }),
      });
      const data = await res.json();
      if (res.ok) {
        updateItemAiAnalysis(item.id, data);
        setActiveTab("ai");
      } else {
        setAiError(data.error || "Failed to analyze clip");
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to analyze clip");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRunOcr = async () => {
    if (isOcrLoading) return;
    setIsOcrLoading(true);
    const res = await performOcrOnImage(item.content);
    setIsOcrLoading(false);
    if (res.success && res.text) {
      updateItemOcrText(item.id, res.text);
      setActiveTab("ocr");
    }
  };

  const collectionObj = collections.find((c) => c.id === item.collection);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-[#111113]">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              {item.type}
            </span>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-md">
              {item.metadata.aiTitle || item.content.slice(0, 40) + "..."}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(item.id)}
              className={`p-1.5 rounded border transition-all ${
                item.favorite
                  ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400"
              }`}
              title="Favorite"
            >
              <Star className={`w-4 h-4 ${item.favorite ? "fill-amber-400" : ""}`} />
            </button>

            <button
              onClick={() => togglePin(item.id)}
              className={`p-1.5 rounded border transition-all ${
                item.pinned
                  ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                  : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
              title="Pin"
            >
              <Pin className={`w-4 h-4 ${item.pinned ? "fill-indigo-400" : ""}`} />
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition-all ${
                copied
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-sm"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied" : "Re-Copy"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 bg-zinc-50 dark:bg-[#0a0a0b] border-b border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1 py-1.5">
            <button
              onClick={() => setActiveTab("formatted")}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                activeTab === "formatted"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Formatted View
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`px-3 py-1.5 rounded font-medium transition-all ${
                activeTab === "raw"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Raw Text
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-1.5 rounded font-medium transition-all flex items-center gap-1 ${
                activeTab === "ai"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Insights</span>
            </button>
            {item.type === "image" && (
              <button
                onClick={() => setActiveTab("ocr")}
                className={`px-3 py-1.5 rounded font-medium transition-all flex items-center gap-1 ${
                  activeTab === "ocr"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                }`}
              >
                <ScanText className="w-3.5 h-3.5" />
                <span>OCR Text</span>
              </button>
            )}
          </div>

          <button
            onClick={handleRunAiAnalysis}
            disabled={isAiLoading}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-all"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{isAiLoading ? "Analyzing..." : "Analyze with Gemini"}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-[#0a0a0b]">
          {activeTab === "formatted" && (
            <div className="space-y-3">
              {item.type === "json" ? (
                <div className="bg-white dark:bg-[#111113] p-4 rounded border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-amber-800 dark:text-amber-300/90 overflow-x-auto">
                  <pre>{tryPrettyJson(item.content)}</pre>
                </div>
              ) : item.type === "hex" && item.metadata.colorHex ? (
                <div className="p-6 rounded-lg bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-3">
                  <div
                    className="w-24 h-24 rounded-lg shadow-xl border-2 border-zinc-300 dark:border-white/20"
                    style={{ backgroundColor: item.metadata.colorHex }}
                  />
                  <div className="text-center">
                    <span className="font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {item.metadata.colorHex}
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
                      {item.metadata.colorRgb} | {item.metadata.colorHsl}
                    </p>
                  </div>
                </div>
              ) : item.type === "image" ? (
                <div className="bg-white dark:bg-[#111113] p-4 rounded border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-3">
                  <img
                    src={item.content}
                    alt="Copied visual"
                    className="max-h-80 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-[#111113] p-4 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {item.content}
                </div>
              )}
            </div>
          )}

          {activeTab === "raw" && (
            <textarea
              readOnly
              value={item.content}
              className="w-full h-64 p-4 rounded bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-800 dark:text-zinc-300 focus:outline-none resize-none"
            />
          )}

          {activeTab === "ai" && (
            <div className="space-y-4">
              {aiError && (
                <div className="p-3 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                  {aiError}
                </div>
              )}

              {item.metadata.aiSummary ? (
                <div className="p-4 rounded bg-white dark:bg-[#111113] border border-amber-200 dark:border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini AI Summary</span>
                  </div>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                    {item.metadata.aiSummary}
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    No AI summary generated yet. Click "Analyze with Gemini" above.
                  </p>
                </div>
              )}

              {item.metadata.aiActionItems && item.metadata.aiActionItems.length > 0 && (
                <div className="p-4 rounded bg-white dark:bg-[#111113] border border-indigo-200 dark:border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <ListTodo className="w-4 h-4" />
                    <span>Detected Action Items</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-800 dark:text-zinc-200">
                    {item.metadata.aiActionItems.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "ocr" && (
            <div className="space-y-3">
              {item.ocr_text ? (
                <div className="p-4 rounded bg-white dark:bg-[#111113] border border-purple-200 dark:border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <ScanText className="w-4 h-4" /> Tesseract OCR Extracted Text
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.ocr_text!)}
                      className="text-xs text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-500/30"
                    >
                      Copy OCR Text
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-purple-900 dark:text-purple-200 whitespace-pre-wrap leading-relaxed">
                    {item.ocr_text}
                  </pre>
                </div>
              ) : (
                <div className="p-6 text-center space-y-3 bg-white dark:bg-[#111113] rounded border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">No OCR text extracted yet.</p>
                  <button
                    onClick={handleRunOcr}
                    disabled={isOcrLoading}
                    className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm"
                  >
                    {isOcrLoading ? "Processing OCR..." : "Run OCR Text Extraction"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tags & Collection Customizers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {/* Tags Editor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Tags
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white dark:bg-[#111113] rounded border border-zinc-200 dark:border-zinc-800">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-indigo-500 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add custom tag..."
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded shadow-sm"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Collection Assign */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> Assign Collection
              </label>
              <select
                value={item.collection || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  updateItemCollection(item.id, val ? val : null);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">No Collection</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>

              {/* Metadata Info */}
              <div className="p-3 bg-white dark:bg-[#111113] rounded border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 font-mono">
                <div>Chars: {item.metadata.charCount || 0} | Words: {item.metadata.wordCount || 0} | Lines: {item.metadata.lineCount || 0}</div>
                <div>Created: {new Date(item.created_at).toLocaleString()}</div>
                <div>Copy Count: {item.copy_count || 1}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function tryPrettyJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}
