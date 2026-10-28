"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function LiveRefresher() {
  const router = useRouter();
  const lastVersion = useRef<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/dashboard/live", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { version?: string; redis?: boolean };
        if (!active) return;
        setLive(Boolean(data.redis));
        if (!lastVersion.current) {
          lastVersion.current = data.version ?? null;
          return;
        }
        if (data.version && data.version !== lastVersion.current) {
          lastVersion.current = data.version;
          router.refresh();
        }
      } catch {
        if (active) setLive(false);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void poll();
    }

    void poll();
    const timer = setInterval(poll, 30000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return (
    <span className={`live-pill ${live ? "is-live" : ""}`} title={live ? "Live data via Upstash Redis" : "Live data"}>
      <span className="live-dot" />
      {live ? "Live" : "Syncing"}
    </span>
  );
}
