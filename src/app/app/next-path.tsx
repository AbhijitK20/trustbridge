"use client";

import { usePathname } from "next/navigation";

export default function NextPath() {
  const pathname = usePathname();
  return <input type="hidden" name="next" value={pathname || "/app"} />;
}
