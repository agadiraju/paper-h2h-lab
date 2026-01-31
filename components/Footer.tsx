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
    <footer className="border-t-2 border-border bg-paper-dark">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-ink-lighter">
          Paper H2H Lab &middot; Plan your FPL H2H battles
        </div>
        <button
          onClick={handleReset}
          className={`text-xs px-2 py-1 rounded border-2 transition-colors ${
            confirming
              ? "bg-danger border-danger text-white hover:bg-danger/90"
              : "text-ink-lighter border-border hover:text-ink hover:bg-paper-darker"
          }`}
        >
          {confirming ? "Click again to confirm reset" : "Reset all data"}
        </button>
      </div>
    </footer>
  );
}
