"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useState } from "react";

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-400" />
        </button>

        <div className="ml-2 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-500" />
        </div>
      </div>
    </header>
  );
}

