"use client";

import { useEffect, useState } from "react";

const ITEMS = [
  { id: "regional", label: "Regional" },
  { id: "notifications", label: "Notifications" },
  { id: "workspace", label: "Workspace" },
  { id: "danger", label: "Danger zone" },
];

export default function SettingsSubnav() {
  const [active, setActive] = useState("regional");

  useEffect(() => {
    const sections = ITEMS.map((item) => document.getElementById(item.id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="ws-subnav" aria-label="Settings sections">
      {ITEMS.map((item) => (
        <a key={item.id} href={`#${item.id}`} className={active === item.id ? "is-active" : ""}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
