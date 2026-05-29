import React from "react";
import Link from "next/link";

export function GlobalFooter() {
  return (
    <footer className="h-10 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 text-xs text-zinc-500 z-10">
      <div>
        &copy; 2026 OmniCommerce, Inc. All rights reserved.
      </div>
      <div className="flex items-center gap-4">
        <Link href="#" className="hover:text-zinc-300 transition-colors">Documentation</Link>
        <Link href="#" className="hover:text-zinc-300 transition-colors">System Status</Link>
        <Link href="#" className="hover:text-zinc-300 transition-colors">Privacy</Link>
        <Link href="#" className="hover:text-zinc-300 transition-colors">Terms</Link>
      </div>
    </footer>
  );
}
