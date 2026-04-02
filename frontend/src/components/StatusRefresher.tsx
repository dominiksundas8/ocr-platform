"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 🛰️ Status Refresher (Modern Polling)
 * Componente invisibile che chiede a Next.js di rinfrescare la pagina server-side
 * se il documento è ancora in elaborazione (PROCESSING).
 */
export default function StatusRefresher({ docId }: { docId: string }) {
  const router = useRouter();

  useEffect(() => {
    // ⏱️ Rinfreschiamo la pagina ogni 3 secondi per vedere se Celery o il Mock hanno finito.
    const interval = setInterval(() => {
      console.log(`[Watcher] Refreshing page for document ${docId}...`);
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [router, docId]);

  return null; // Non renderizza nulla, lavora "dietro le quinte"
}
