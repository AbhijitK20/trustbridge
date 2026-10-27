import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrustBridge — Verify before you pay",
    short_name: "TrustBridge",
    description: "Four-state verification and protected deals for work found in chat.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e8",
    theme_color: "#1b4d3e",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
