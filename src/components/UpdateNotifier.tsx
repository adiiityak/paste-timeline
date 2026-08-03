import React, { useState, useEffect } from "react";
import { RefreshCw, Sparkles, CheckCircle2, ArrowUpCircle, X } from "lucide-react";

export const UpdateNotifier: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        setRegistration(reg);

        // Check if there's already a worker waiting to activate
        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      });

      // Listen for controllerchange so app reloads smoothly after update
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleApplyUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  const handleManualCheck = () => {
    setIsChecking(true);
    setJustChecked(false);

    if (registration) {
      registration.update().then(() => {
        setIsChecking(false);
        setJustChecked(true);
        setTimeout(() => setJustChecked(false), 3000);
      }).catch(() => {
        setIsChecking(false);
        setJustChecked(true);
        setTimeout(() => setJustChecked(false), 3000);
      });
    } else {
      setTimeout(() => {
        setIsChecking(false);
        setJustChecked(true);
        setTimeout(() => setJustChecked(false), 3000);
      }, 1000);
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-top duration-300">
      <div className="bg-indigo-900/90 dark:bg-indigo-950/95 border border-indigo-500/50 text-white p-3.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>New PasteTimeline Update Available!</span>
              <span className="text-[10px] bg-amber-400 text-zinc-900 font-extrabold px-1.5 py-0.2 rounded uppercase">
                v1.2.5
              </span>
            </h4>
            <p className="text-[11px] text-indigo-200">
              New features & performance enhancements are ready to install.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleApplyUpdate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-lg transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Update Now</span>
          </button>
          <button
            onClick={() => setUpdateAvailable(false)}
            className="p-1 rounded text-indigo-300 hover:text-white hover:bg-indigo-800/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
