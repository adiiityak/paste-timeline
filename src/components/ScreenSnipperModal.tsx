import React, { useState, useRef, useEffect } from "react";
import {
  Scissors,
  Crop,
  Camera,
  X,
  Check,
  Sparkles,
  RotateCcw,
  Zap,
} from "lucide-react";
import { useClipboardStore } from "../stores/clipboardStore";

interface ScreenSnipperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScreenSnipperModal: React.FC<ScreenSnipperModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addClipboardItem, showToast } = useClipboardStore();

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDraggingBox, setIsDraggingBox] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCapturedImage(null);
      setCropBox(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Listen for paste event inside modal to instantly load pasted image
  useEffect(() => {
    if (!isOpen) return;
    const handleModalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target?.result as string;
                if (base64) {
                  setCapturedImage(base64);
                  showToast("Loaded clipboard screenshot for snipping!");
                }
              };
              reader.readAsDataURL(blob);
              break;
            }
          }
        }
      }
    };
    window.addEventListener("paste", handleModalPaste);
    return () => window.removeEventListener("paste", handleModalPaste);
  }, [isOpen, showToast]);

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target?.result as string;
                if (base64) {
                  setCapturedImage(base64);
                  showToast("Loaded clipboard screenshot for snipping!");
                }
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
      }
      showToast("No image found on clipboard. Take a screenshot (Cmd+Shift+4 / Win+Shift+S) first!");
    } catch {
      showToast("Press Cmd+V / Ctrl+V to paste your screenshot!");
    }
  };

  // 1. Capture screen using Screen Capture API (navigator.mediaDevices.getDisplayMedia)
  const handleStartScreenCapture = async () => {
    setIsCapturingScreen(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      // Wait a moment for frame render
      setTimeout(() => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/png");
          setCapturedImage(dataUrl);

          // Stop all video tracks
          stream.getTracks().forEach((track) => track.stop());
          setIsCapturingScreen(false);
          showToast("Screen captured! Drag a box to snip or click 'Save Full Image'.");
        }
      }, 500);
    } catch (err: any) {
      setIsCapturingScreen(false);
      console.warn("Screen capture cancelled or not allowed:", err);
      showToast("Display capture permission denied. Take screenshot (Cmd+Shift+4) & press Cmd+V!");
    }
  };

  // Drag Snipping Box Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!capturedImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setCropBox({ x, y, w: 0, h: 0 });
    setIsDraggingBox(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingBox || !dragStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    const w = Math.abs(currentX - dragStart.x);
    const h = Math.abs(currentY - dragStart.y);

    setCropBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setIsDraggingBox(false);
  };

  // Crop & Save Snippet
  const handleSaveSnippet = async () => {
    if (!capturedImage) return;

    if (!cropBox || cropBox.w < 10 || cropBox.h < 10) {
      // Save Full Screenshot
      await addClipboardItem(capturedImage, "Screen Screenshot", "image");
      showToast("Full screen screenshot saved to PasteTimeline!");
      onClose();
      return;
    }

    // Crop box area from image
    const img = new Image();
    img.src = capturedImage;
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const container = imageRef.current;
      if (!container) return;

      const scaleX = img.naturalWidth / container.clientWidth;
      const scaleY = img.naturalHeight / container.clientHeight;

      const cropX = cropBox.x * scaleX;
      const cropY = cropBox.y * scaleY;
      const cropW = cropBox.w * scaleX;
      const cropH = cropBox.h * scaleY;

      canvas.width = cropW;
      canvas.height = cropH;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        const snippetDataUrl = canvas.toDataURL("image/png");
        await addClipboardItem(snippetDataUrl, "Screen Snippet", "image");
        showToast("Cropped screen snippet saved to PasteTimeline!");
        onClose();
      }
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#111113]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Screen Snipper & Image Capture Tool
                </h3>
                <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 rounded font-bold">
                  Hotkey: Cmd+Shift+S
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Snip any region of your screen or window directly into PasteTimeline
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

        {/* Action Toolbar */}
        <div className="p-3 bg-zinc-100 dark:bg-[#0a0a0b] border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartScreenCapture}
              disabled={isCapturingScreen}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>{isCapturingScreen ? "Capturing Screen..." : "Capture Screen / Window"}</span>
            </button>

            <button
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow transition-all"
              title="Paste screenshot from system clipboard (Cmd+V)"
            >
              <Zap className="w-4 h-4" />
              <span>Paste Screenshot (Cmd+V)</span>
            </button>
          </div>

          {capturedImage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setCropBox(null);
                }}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-semibold"
                title="Reset Image"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleSaveSnippet}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{cropBox && cropBox.w > 10 ? "Save Snipped Region" : "Save Full Image"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Preview / Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950 flex items-center justify-center min-h-[380px] relative">
          {!capturedImage ? (
            <div className="text-center space-y-4 max-w-md p-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
                <Crop className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  No Screen Frame Captured Yet
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Click <strong>"Capture Screen / Window"</strong> above to take an interactive screen snip.
                </p>
              </div>

              {/* Instructions Pill */}
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-left text-[11px] text-zinc-300 space-y-1">
                <div className="font-bold text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Automatic System Screenshots:
                </div>
                <p>
                  Any screenshot taken on your OS (e.g., <strong>Cmd+Ctrl+Shift+4</strong> on Mac or <strong>Win+Shift+S</strong> on Windows) is automatically captured in PasteTimeline!
                </p>
              </div>
            </div>
          ) : (
            <div
              className="relative max-w-full max-h-full cursor-crosshair select-none border border-zinc-800 rounded shadow-2xl overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={capturedImage}
                alt="Captured Screen"
                className="max-h-[60vh] object-contain pointer-events-none"
              />

              {/* Crop Selection Overlay Box */}
              {cropBox && (
                <div
                  className="absolute border-2 border-amber-400 bg-amber-400/20 shadow-2xl pointer-events-none"
                  style={{
                    left: `${cropBox.x}px`,
                    top: `${cropBox.y}px`,
                    width: `${cropBox.w}px`,
                    height: `${cropBox.h}px`,
                  }}
                >
                  <div className="absolute top-1 left-1 bg-amber-500 text-zinc-950 font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow">
                    {Math.round(cropBox.w)} × {Math.round(cropBox.h)} px
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111113] flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Drag a box on the captured image to crop an exact snip region</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
