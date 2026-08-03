import React, { useState } from "react";
import {
  Copy,
  Check,
  Star,
  Pin,
  Trash2,
  ExternalLink,
  Code2,
  Globe,
  Mail,
  Phone,
  FileCode,
  Image as ImageIcon,
  Palette,
  FileText,
  ScanText,
  Sparkles,
  Tag as TagIcon,
  Eye,
  EyeOff,
  Folder,
} from "lucide-react";
import { ClipboardItem, ClipboardType } from "../types/clipboard";
import { useClipboardStore } from "../stores/clipboardStore";
import { performOcrOnImage } from "../utils/ocrEngine";

interface ClipCardProps {
  item: ClipboardItem;
  isSelected?: boolean;
  onSelectToggle?: () => void;
}

export const ClipCard: React.FC<ClipCardProps> = ({ item, isSelected, onSelectToggle }) => {
  const {
    copyItemToClipboard,
    toggleFavorite,
    togglePin,
    deleteItem,
    setSelectedItem,
    updateItemOcrText,
    collections,
  } = useClipboardStore();

  const [copied, setCopied] = useState(false);
  const [isMaskRevealed, setIsMaskRevealed] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>("");

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyItemToClipboard(item);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleRunOcr = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOcrProcessing) return;
    setIsOcrProcessing(true);
    setOcrStatus("Running OCR...");

    const res = await performOcrOnImage(item.content, (msg) => setOcrStatus(msg));
    setIsOcrProcessing(false);

    if (res.success && res.text) {
      updateItemOcrText(item.id, res.text);
    } else {
      setOcrStatus("OCR Error: " + (res.error || "No text found"));
    }
  };

  // Find collection name
  const collectionObj = collections.find((c) => c.id === item.collection);

  // Type styling details
  const getTypeBadge = (type: ClipboardType) => {
    switch (type) {
      case "code":
        return { label: item.metadata.language || "Code", icon: <Code2 className="w-3.5 h-3.5 text-cyan-400" />, border: "border-cyan-500/30", bg: "bg-cyan-500/10 text-cyan-300" };
      case "json":
        return { label: "JSON", icon: <FileCode className="w-3.5 h-3.5 text-amber-400" />, border: "border-amber-500/30", bg: "bg-amber-500/10 text-amber-300" };
      case "sql":
        return { label: "SQL", icon: <FileCode className="w-3.5 h-3.5 text-emerald-400" />, border: "border-emerald-500/30", bg: "bg-emerald-500/10 text-emerald-300" };
      case "url":
        return { label: "URL", icon: <Globe className="w-3.5 h-3.5 text-blue-400" />, border: "border-blue-500/30", bg: "bg-blue-500/10 text-blue-300" };
      case "hex":
        return { label: "Color", icon: <Palette className="w-3.5 h-3.5 text-pink-400" />, border: "border-pink-500/30", bg: "bg-pink-500/10 text-pink-300" };
      case "email":
        return { label: "Email", icon: <Mail className="w-3.5 h-3.5 text-violet-400" />, border: "border-violet-500/30", bg: "bg-violet-500/10 text-violet-300" };
      case "phone":
        return { label: "Phone", icon: <Phone className="w-3.5 h-3.5 text-teal-400" />, border: "border-teal-500/30", bg: "bg-teal-500/10 text-teal-300" };
      case "image":
        return { label: "Image", icon: <ImageIcon className="w-3.5 h-3.5 text-purple-400" />, border: "border-purple-500/30", bg: "bg-purple-500/10 text-purple-300" };
      case "filepath":
        return { label: "File Path", icon: <FileText className="w-3.5 h-3.5 text-slate-400" />, border: "border-slate-500/30", bg: "bg-slate-500/10 text-slate-300" };
      default:
        return { label: "Text", icon: <FileText className="w-3.5 h-3.5 text-indigo-400" />, border: "border-indigo-500/20", bg: "bg-indigo-500/10 text-indigo-300" };
    }
  };

  const typeConfig = getTypeBadge(item.type);

  // Content display logic
  const displayContent = item.metadata.isSensitive && !isMaskRevealed
    ? item.metadata.maskedContent || "•••••••• (Sensitive Masked)"
    : item.content;

  const timeAgo = formatTimeAgo(item.created_at);

  return (
    <div
      onClick={() => setSelectedItem(item)}
      className={`group relative rounded-lg bg-white dark:bg-zinc-900 border transition-all duration-200 p-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md ${
        item.pinned
          ? "border-amber-400 dark:border-amber-500/40 bg-amber-50/50 dark:bg-zinc-900 shadow-amber-500/5"
          : isSelected
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/80"
      }`}
    >
      {/* Top Bar info */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Checkbox for bulk select */}
          {onSelectToggle && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => {
                e.stopPropagation();
                onSelectToggle();
              }}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500/20 bg-white dark:bg-zinc-950 cursor-pointer"
            />
          )}

          {/* Type Badge */}
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded border ${typeConfig.bg} ${typeConfig.border}`}>
            {typeConfig.icon}
            <span>{typeConfig.label}</span>
          </span>

          {/* App Source */}
          {item.app_name && (
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              {item.app_name}
            </span>
          )}

          {/* Collection Tag */}
          {collectionObj && (
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
              <Folder className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              {collectionObj.name}
            </span>
          )}

          {/* AI Generated Title Badge */}
          {item.metadata.aiTitle && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              {item.metadata.aiTitle}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Sensitive Reveal Button */}
          {item.metadata.isSensitive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMaskRevealed(!isMaskRevealed);
              }}
              className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-300 transition-all"
              title={isMaskRevealed ? "Hide Sensitive Data" : "Reveal Sensitive Data"}
            >
              {isMaskRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Star Favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className={`p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${
              item.favorite ? "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" : "text-zinc-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400"
            }`}
            title={item.favorite ? "Unstar" : "Star item"}
          >
            <Star className={`w-3.5 h-3.5 ${item.favorite ? "fill-amber-400" : ""}`} />
          </button>

          {/* Pin */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePin(item.id);
            }}
            className={`p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${
              item.pinned ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
            title={item.pinned ? "Unpin item" : "Pin to top"}
          >
            <Pin className={`w-3.5 h-3.5 ${item.pinned ? "fill-indigo-400" : ""}`} />
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteItem(item.id);
            }}
            className="p-1.5 rounded text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Quick Copy Button */}
          <button
            onClick={handleCopy}
            className={`ml-1 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded border transition-all ${
              copied
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-sm"
            }`}
            title="Copy to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Render */}
      <div className="my-2 text-sm text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
        {item.type === "hex" && item.metadata.colorHex ? (
          <div className="flex items-center gap-3 bg-zinc-100 dark:bg-[#0a0a0b] p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
            <div
              className="w-10 h-10 rounded border border-zinc-300 dark:border-white/20 shrink-0"
              style={{ backgroundColor: item.metadata.colorHex }}
            />
            <div className="space-y-0.5">
              <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-wider">
                {item.metadata.colorHex}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {item.metadata.colorRgb} • {item.metadata.colorHsl}
              </p>
            </div>
          </div>
        ) : item.type === "image" ? (
          <div className="space-y-2">
            <div className="relative max-h-48 overflow-hidden rounded bg-zinc-100 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-2">
              <img
                src={item.content}
                alt="Clipboard snapshot"
                className="max-h-44 object-contain rounded"
              />
            </div>
            {/* OCR Extracted Text Preview */}
            {item.ocr_text ? (
              <div className="bg-purple-50 dark:bg-[#0a0a0b] p-2.5 rounded border border-purple-200 dark:border-purple-500/30 text-xs font-mono text-purple-900 dark:text-purple-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <ScanText className="w-3.5 h-3.5" /> Extracted OCR Text
                  </span>
                  <span>{item.ocr_text.length} chars</span>
                </div>
                <p className="line-clamp-2">{item.ocr_text}</p>
              </div>
            ) : (
              <button
                onClick={handleRunOcr}
                disabled={isOcrProcessing}
                className="w-full py-1.5 px-3 rounded bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-200 dark:hover:bg-purple-600/30 border border-purple-300 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <ScanText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{isOcrProcessing ? ocrStatus || "Extracting Text..." : "Extract Text with OCR"}</span>
              </button>
            )}
          </div>
        ) : item.type === "url" ? (
          <div className="bg-zinc-100 dark:bg-[#0a0a0b] p-2.5 rounded border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 truncate text-xs">
                <Globe className="w-3.5 h-3.5" />
                {item.metadata.urlDomain || "Web Link"}
              </span>
              <a
                href={item.content}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all line-clamp-2">{displayContent}</p>
          </div>
        ) : item.type === "code" || item.type === "json" || item.type === "sql" ? (
          <pre className="bg-zinc-100 dark:bg-[#0a0a0b] p-3 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-indigo-800 dark:text-indigo-300 overflow-x-auto line-clamp-4 leading-relaxed">
            <code>{displayContent}</code>
          </pre>
        ) : (
          <p className="line-clamp-3 text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed font-sans whitespace-pre-wrap">
            {displayContent}
          </p>
        )}
      </div>

      {/* Footer Info: Tags, Copy Count, Timestamp */}
      <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <TagIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
              {item.tags.map((t) => (
                <span key={t} className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 text-zinc-500 font-mono">
          {(item.copy_count || 0) > 1 && (
            <span className="text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-500/20">
              Copied {item.copy_count}x
            </span>
          )}
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}
