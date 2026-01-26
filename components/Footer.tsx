"use client";

import { useUserStore } from "@/lib/store/userStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Footer() {
  const { resetAll } = useUserStore();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const handleReset = () => {
    if (!confirming) {
      setConfirming(true);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    resetAll();
    setConfirming(false);
    router.push("/");
  };

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Paper H2H Lab &middot; Plan your FPL H2H battles
        </div>
        <button
          onClick={handleReset}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            confirming
              ? "bg-red-600 text-white hover:bg-red-500"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          }`}
        >
          {confirming ? "Click again to confirm reset" : "Reset all data"}
        </button>
      </div>
    </footer>
  );
}
